import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { withErrorReporting } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "POST /api/unsubscribe";

/* ── 这条路由**故意**不要求登录 ────────────────────────────────
   CAN-SPAM §316.5：退订不得要求收件人提供除邮箱地址与偏好之外的
   任何信息，也不得要求访问「除单一网页之外」的任何页面。所以：
   没有 Clerk、没有验证码、没有确认邮件、没有二次跳转。
   一次 POST 就必须真的生效。                                    */

const Payload = z
  .object({
    /** 邮件里那条链接带的 unsub_token */
    token: z.string().trim().min(6, "That link is missing its code.").max(200).optional(),
    /** 手动退订：访客自己输入的地址 */
    email: z.email("That email address does not look right.").max(200).optional(),
    action: z.enum(["unsubscribe", "resubscribe"]).default("unsubscribe"),
  })
  .refine((v) => Boolean(v.token || v.email), {
    message: "Enter the address you want removed.",
  });

function fail(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

const normalize = (raw: string) => raw.trim().toLowerCase();

/**
 * 读请求体。三种来源都要吃下：
 *  1. 我们自己的页面 —— application/json
 *  2. RFC 8058 一键退订 —— Gmail / Yahoo 直接 POST
 *     `List-Unsubscribe=One-Click`（form 编码），token 只在 query 的 ?t= 里
 *  3. 极简客户端 —— 空 body，全靠 query
 * 拿不到 token 时不报错，交给 zod 统一给人话。
 */
async function readPayload(req: NextRequest): Promise<unknown> {
  const fromUrl = req.nextUrl.searchParams.get("t")?.trim() || undefined;
  const type = req.headers.get("content-type") ?? "";

  if (type.includes("application/json")) {
    const body = await req.json().catch(() => null);
    if (body && typeof body === "object") {
      const b = body as Record<string, unknown>;
      return b.token || b.email ? b : { ...b, token: fromUrl };
    }
    return { token: fromUrl };
  }

  // 邮箱服务商的一键退订：body 是 List-Unsubscribe=One-Click，没有地址信息
  if (fromUrl) return { token: fromUrl };

  const form = await req.formData().catch(() => null);
  const email = form?.get("email");
  return { email: typeof email === "string" ? email : undefined };
}

/** token → 收件地址。查不到就是链接被改过或那封信早被删了。 */
async function emailForToken(token: string): Promise<string | null> {
  const rows = (await sql`
    SELECT to_email FROM outreach WHERE unsub_token = ${token} LIMIT 1
  `) as { to_email: string }[];
  const found = rows[0]?.to_email;
  return found ? normalize(found) : null;
}

async function suppress(email: string, source: "link" | "manual") {
  await sql`
    INSERT INTO suppression (email, reason, source)
    VALUES (${email}, 'unsubscribe', ${source})
    ON CONFLICT (email) DO NOTHING
  `;

  // 队列里还没发出去的那几封也一并作废 —— 抑制表只挡未来的入队，
  // 已经排上的必须当场改掉，否则退订完还会再收到一封。
  //
  // 必须 lower(to_email) 比：抓来的地址大小写五花八门（Jonathan.Smoke@…），
  // 而抑制表里存的一律是小写。直接等号比会一行都匹配不上，人退了订还照发。
  await sql`
    UPDATE outreach
       SET status = 'unsubscribed'
     WHERE lower(to_email) = ${email}
       AND status <> 'unsubscribed'
  `;
}

/**
 * 撤销退订。只删我们自己写的 reason='unsubscribe'。
 * 硬退信（bounce）和垃圾邮件投诉（complaint）留在表里不动 ——
 * 那两种地址一旦复活会直接烧掉整个发信域的信誉，而且收件人本人
 * 也从没要求过我们再发。
 */
async function unsuppress(email: string) {
  await sql`
    DELETE FROM suppression WHERE email = ${email} AND reason = 'unsubscribe'
  `;
}

const handle = withErrorReporting(ROUTE, async (req: NextRequest) => {
  const parsed = Payload.safeParse(await readPayload(req));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the address and try again.", 400);
  }

  const { token, action } = parsed.data;

  let email: string | null = parsed.data.email ? normalize(parsed.data.email) : null;
  let source: "link" | "manual" = "manual";

  if (token) {
    const viaToken = await emailForToken(token);
    if (!viaToken) {
      return fail(
        "That unsubscribe link is no longer valid. Enter your address below and we will remove it.",
        404
      );
    }
    email = viaToken;
    source = "link";
  }

  if (!email) return fail("Enter the address you want removed.", 400);

  if (action === "resubscribe") {
    await unsuppress(email);
    return NextResponse.json({ ok: true, state: "subscribed" });
  }

  await suppress(email, source);
  return NextResponse.json({ ok: true, state: "unsubscribed" });
});

export async function POST(req: NextRequest) {
  try {
    return await handle(req);
  } catch {
    // withErrorReporting 已经把异常写进错误收件箱并重新抛出。
    // 退订失败必须给出一条真人能走通的后路，不能只丢一页 500。
    return fail(
      "Something broke on our side and we could not record that. Email contact@frontcanvas.com and a person will remove you by hand.",
      500
    );
  }
}

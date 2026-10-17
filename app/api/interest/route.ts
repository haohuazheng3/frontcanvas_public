import { NextResponse, after, type NextRequest } from "next/server";
import { z } from "zod";
import { newId, sql } from "@/lib/db";
import { withErrorReporting } from "@/lib/errors";
import { APP_URL, notifyOwner, telLink } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "POST /api/interest";

/**
 * 「我想要这个网站」—— 零门槛意向。
 *
 * 展示页原来唯一能点的是三张价格卡：先注册、再付 $345 / $645 定金。
 * 复盘时 5 家看到了价格区，0 个人点 —— 陌生人收到冷邮件，第一步是「先聊聊」，不是「先付钱」。
 * 这里只要一个联系方式，不注册、不付钱，提交即把线索标成 interested 并立刻通知站长。
 *
 * 报错文案直接面向商家，所以写成人话，前端原样展示。
 */

const Payload = z.object({
  slug: z.string().regex(/^[a-z0-9]{6,14}$/, "This page link looks incomplete."),
  name: z.string().trim().max(120, "That name is longer than we can store.").optional(),
  contact: z
    .string()
    .trim()
    .min(5, "Leave a phone number or an email so we can reach you.")
    .max(200, "That is longer than we can store.")
    .refine(
      (v) => (v.includes("@") ? /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v) : v.replace(/\D/g, "").length >= 7),
      "That does not look like a phone number or an email address."
    ),
  method: z.enum(["call", "text", "email"]).optional(),
  tier: z.enum(["launch", "complete", "unsure"]).optional(),
  message: z.string().trim().max(2000, "That note is longer than we can store.").optional(),
  /** 蜜罐 —— 真人看不见这个字段。填了的一律当机器人。 */
  website: z.string().max(500).optional(),
});

const METHOD_WORD = { call: "打电话", text: "发短信", email: "发邮件" } as const;
const TIER_WORD = { launch: "Launch（$690）", complete: "Complete（$1,290，含订餐）", unsure: "还没想好" } as const;

/* 同一 IP 10 分钟内最多 3 次：挡手滑连点和低级脚本，不是安全边界（单实例近似，同 /api/contact） */
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();
function overLimit(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.set(ip, recent);
  return recent.length >= 3;
}
function record(ip: string) {
  const now = Date.now();
  hits.set(ip, [...(hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS), now]);
}

function fail(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

const handle = withErrorReporting(ROUTE, async (req: NextRequest) => {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]!.trim() || "unknown";
  if (overLimit(ip)) {
    return fail("We already have your note — someone will reach out soon. Or write to contact@frontcanvas.com.", 429);
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return fail("We could not read that. Please try again.", 400);
  }
  const parsed = Payload.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Please check the form and try again.", 400);

  const { slug, name, contact, method, tier, message, website } = parsed.data;
  record(ip);
  if (website && website.trim()) return NextResponse.json({ ok: true });

  const [lead] = (await sql`
    SELECT l.id, l.name, l.city, l.phone, l.email
    FROM designs d JOIN leads l ON l.id = d.lead_id
    WHERE d.slug = ${slug} LIMIT 1
  `) as { id: string; name: string; city: string | null; phone: string | null; email: string | null }[];
  if (!lead) return fail("We could not find this design. Write to contact@frontcanvas.com and we will sort it out.", 404);

  await sql`
    INSERT INTO interests (id, lead_id, slug, name, contact, method, tier, message)
    VALUES (${newId("int_")}, ${lead.id}, ${slug}, ${name || null}, ${contact}, ${method ?? null}, ${tier ?? null}, ${message || null})
  `;
  // 有意向的不再收跟进邮件；已经成交的保持 won
  await sql`UPDATE leads SET status = 'interested', updated_at = now() WHERE id = ${lead.id} AND status <> 'won'`;

  after(async () => {
    try {
      await notifyOwner(`🔥 ${lead.name} 说想要这个网站`, [
        `${lead.name}${lead.city ? `（${lead.city}）` : ""}在展示页上提交了「我想要这个网站」。`,
        "",
        `称呼：${name || "（没填）"}`,
        `联系方式：${contact}`,
        `希望我们：${method ? METHOD_WORD[method] : "（没选）"}`,
        `感兴趣的套餐：${tier ? TIER_WORD[tier] : "（没选）"}`,
        `留言：${message || "（无）"}`,
        "",
        `店里电话：${telLink(lead.phone)}`,
        `展示页：${APP_URL}/p/${slug}`,
        `设计稿：${APP_URL}/d/${slug}`,
        `后台：${APP_URL}/admin`,
        "",
        "页面上答应了「一个工作日内联系」，请今天或明天回复。",
      ]);
    } catch (err) {
      console.error("[/api/interest] notify failed", err);
    }
  });

  return NextResponse.json({ ok: true });
});

export async function POST(req: NextRequest) {
  try {
    return await handle(req);
  } catch {
    return fail("Something broke on our side. Please try again, or email contact@frontcanvas.com.", 500);
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { newId, sql } from "@/lib/db";
import { withErrorReporting } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "POST /api/contact";

/* ── 校验 ──────────────────────────────────────────────────
   报错文案直接面向访客，所以每条都写成人话，前端原样展示。   */

const Payload = z.object({
  name: z.string().trim().max(120, "That name is longer than we can store.").optional(),
  email: z
    .email("That email address does not look right.")
    .max(200, "That email address is too long."),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more — at least ten characters.")
    .max(5000, "That message is longer than we can store. Trim it a little and try again."),
  source: z.string().trim().max(64).optional(),
  /** 蜜罐 —— 真人看不见这个字段。填了的一律当机器人。 */
  website: z.string().max(500).optional(),
});

/* ── 限流 ──────────────────────────────────────────────────
   同一 IP 10 分钟内最多 3 次。

   注意：这是**单实例近似**。计数存在进程内存里，serverless 上每个实例
   各记各的，冷启动后归零。它挡的是「同一个人手滑连点」和低级脚本，
   不是安全边界；真要防刷得换 Redis / Upstash 之类的共享计数器。        */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const MAX_TRACKED_IPS = 5000;

const hits = new Map<string, number[]>();

function prune(now: number) {
  for (const [ip, stamps] of hits) {
    const live = stamps.filter((t) => now - t < WINDOW_MS);
    if (live.length) hits.set(ip, live);
    else hits.delete(ip);
  }
}

function live(ip: string, now: number): number[] {
  return (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
}

/** 只看，不记。超限时也不累加，免得持续敲门把窗口无限往后推。 */
function overLimit(ip: string): boolean {
  const now = Date.now();
  if (hits.size > MAX_TRACKED_IPS) prune(now);

  const recent = live(ip, now);
  hits.set(ip, recent);
  return recent.length >= MAX_PER_WINDOW;
}

/**
 * 只有「被受理的提交」才计数 —— 校验没过的一律不记。
 * 否则真人连打三个错字就被锁十分钟，而机器人本来就不在乎 400。
 */
function record(ip: string) {
  const now = Date.now();
  hits.set(ip, [...live(ip, now), now]);
}

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** 来源标记只用于内部归因，不入用户可见文案 —— 直接洗白名单字符 */
function cleanSource(raw: string | undefined): string {
  const s = (raw ?? "").replace(/[^a-zA-Z0-9._/-]/g, "").slice(0, 64);
  return s || "contact-page";
}

function fail(error: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ ok: false, error }, { status, headers });
}

/* ── handler ─────────────────────────────────────────────── */

const handle = withErrorReporting(ROUTE, async (req: NextRequest) => {
  const ip = clientIp(req);

  if (overLimit(ip)) {
    return fail(
      "That is a few messages in a short window. Give it ten minutes, or write to contact@frontcanvas.com directly.",
      429,
      { "retry-after": String(WINDOW_MS / 1000) }
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return fail("We could not read that submission. Please try again.", 400);
  }

  const parsed = Payload.safeParse(raw);
  if (!parsed.success) {
    return fail(
      parsed.error.issues[0]?.message ?? "Please check the form and try again.",
      400
    );
  }

  const { name, email, message, website } = parsed.data;
  record(ip);

  // 蜜罐命中：返回 200 让机器人以为成功，但什么都不写。
  if (website && website.trim()) {
    return NextResponse.json({ ok: true });
  }

  await sql`
    INSERT INTO contacts (id, name, email, message, source)
    VALUES (
      ${newId("ct_")},
      ${name?.trim() || null},
      ${email.trim().toLowerCase()},
      ${message},
      ${cleanSource(parsed.data.source)}
    )
  `;

  return NextResponse.json({ ok: true });
});

export async function POST(req: NextRequest) {
  try {
    return await handle(req);
  } catch {
    // withErrorReporting 已经把异常写进错误收件箱后重新抛出。
    // 这里只负责给访客一个能读懂的兜底，而不是一页 500。
    return fail(
      "Something broke on our side. Please try again, or email contact@frontcanvas.com.",
      500
    );
  }
}

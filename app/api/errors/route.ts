import { NextResponse } from "next/server";
import { z } from "zod";
import { reportError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  name: z.string().max(200).optional(),
  message: z.string().min(1).max(2000),
  stack: z.string().max(12000).optional(),
  route: z.string().max(500).optional(),
  scope: z.enum(["server", "client", "edge", "cron"]).optional(),
  severity: z.enum(["warn", "error", "fatal"]).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

// 单实例近似限流：一个 IP 每分钟最多 30 条，防止死循环刷爆库
const hits = new Map<string, { n: number; reset: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  const cur = hits.get(ip);
  if (!cur || now > cur.reset) {
    hits.set(ip, { n: 1, reset: now + 60_000 });
    return false;
  }
  cur.n++;
  if (hits.size > 5000) hits.clear();
  return cur.n > 30;
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-vercel-forwarded-for") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  if (limited(ip)) return NextResponse.json({ ok: false, reason: "rate_limited" }, { status: 429 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_json" }, { status: 400 });
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  await reportError({
    ...parsed.data,
    scope: parsed.data.scope ?? "client",
    meta: { ...(parsed.data.meta ?? {}), ua: req.headers.get("user-agent")?.slice(0, 200) },
  });

  return NextResponse.json({ ok: true });
}

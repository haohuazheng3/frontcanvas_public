import { NextResponse } from "next/server";
import { z } from "zod";

import { sql } from "@/lib/db";
import { adminRequestAllowed } from "@/lib/admin";
import { withErrorReporting } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  id: z.string().min(1).max(120),
  /** 应急通道：cookie 用不了时可以直接把钥匙放 body */
  k: z.string().max(400).optional(),
});

/* 这个端点吃密钥，所以必须有暴力破解的天花板。单实例近似限流足够 ——
   同一个 IP 每分钟 20 次，超了一律 404（和鉴权失败长得一模一样）。 */
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
  return cur.n > 20;
}

/** 后台整体对外必须「不存在」：鉴权失败、限流、找不到都回同一个 404 */
function gone() {
  return NextResponse.json({ ok: false }, { status: 404 });
}

export const POST = withErrorReporting(
  "/api/admin/resolve",
  async (req: Request): Promise<NextResponse> => {
    const ip =
      req.headers.get("x-vercel-forwarded-for") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    if (limited(ip)) return gone();

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return gone();
    }

    const parsed = Body.safeParse(raw);
    if (!parsed.success) return gone();

    if (!(await adminRequestAllowed(req, parsed.data.k))) return gone();

    const rows = (await sql`
      UPDATE errors
         SET resolved = true, resolved_at = now()
       WHERE id = ${parsed.data.id}
      RETURNING id
    `) as { id: string }[];

    if (rows.length === 0) return gone();

    return NextResponse.json(
      { ok: true, id: rows[0].id },
      { headers: { "cache-control": "no-store" } }
    );
  }
);

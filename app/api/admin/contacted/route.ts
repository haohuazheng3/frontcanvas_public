import { NextResponse } from "next/server";
import { z } from "zod";

import { sql } from "@/lib/db";
import { adminRequestAllowed } from "@/lib/admin";
import { withErrorReporting } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 「已联系」：站长打过电话 / 回过信之后在 /admin 点一下。
 * 线索标成 replied、意向标成已处理 —— 之后不会再收到自动跟进邮件
 * （ops/followup.mjs 跳过 interested / replied / won）。
 */

const Body = z.object({
  leadId: z.string().regex(/^lead_[a-z0-9]{6,40}$/),
  /** 应急通道：cookie 用不了时可以直接把钥匙放 body */
  k: z.string().max(400).optional(),
});

/* 吃密钥的端点必须有暴力破解的天花板：同一个 IP 每分钟 20 次，超了一律 404 */
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
  "/api/admin/contacted",
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

    const { leadId } = parsed.data;
    // 已成交的不降级成 replied
    const rows = (await sql`
      UPDATE leads
         SET status = CASE WHEN status = 'won' THEN status ELSE 'replied' END,
             updated_at = now()
       WHERE id = ${leadId}
      RETURNING id, status
    `) as { id: string; status: string }[];

    if (rows.length === 0) return gone();

    await sql`UPDATE interests SET handled = true WHERE lead_id = ${leadId}`;

    return NextResponse.json(
      { ok: true, id: rows[0].id, status: rows[0].status },
      { headers: { "cache-control": "no-store" } }
    );
  }
);

import { NextResponse } from "next/server";
import { sql, newId } from "@/lib/db";
import { withErrorReporting } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 测试收件箱入口。Cloudflare Email Worker 收到发往 test@frontcanvas.com 的邮件后 POST 到这里。
 *
 * 它存在的唯一目的是让注册流程可以全自动跑通：机器人自己收验证码、自己填。
 * 同时保留 DKIM/SPF 认证头 —— 那是「邮件真的送达且通过认证」的证据，
 * 比「接口返回 200」有意义得多。
 */
export const POST = withErrorReporting("/api/inbox", async (req: Request) => {
  const secret = req.headers.get("x-inbox-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    to?: string; from?: string; subject?: string; text?: string;
    headers?: Record<string, string>; authResults?: string;
  } | null;

  if (!body?.to) return NextResponse.json({ ok: false, reason: "no_to" }, { status: 400 });

  await sql`
    INSERT INTO inbox (id, to_addr, from_addr, subject, body_text, headers, auth_results)
    VALUES (${newId("in_")}, ${body.to}, ${body.from ?? null}, ${body.subject ?? null},
            ${(body.text ?? "").slice(0, 20000)},
            ${JSON.stringify(body.headers ?? {})}::jsonb, ${body.authResults ?? null})`;

  return NextResponse.json({ ok: true });
});

/** 受保护的读取端点：自动化测试用它取最新验证码 */
export const GET = withErrorReporting("/api/inbox", async (req: Request) => {
  const url = new URL(req.url);
  if (url.searchParams.get("k") !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // 分支写，不要在 SQL 里用 (${to} IS NULL OR ...) —— 同一个值绑两次时
  // 过滤会静默失效，实测表现为「明明有记录却返回 0 条」
  const to = url.searchParams.get("to");
  const rows = (to
    ? await sql`
        SELECT id, to_addr, from_addr, subject, body_text, auth_results, received_at
        FROM inbox WHERE lower(to_addr) = lower(${to})
        ORDER BY received_at DESC LIMIT 10`
    : await sql`
        SELECT id, to_addr, from_addr, subject, body_text, auth_results, received_at
        FROM inbox ORDER BY received_at DESC LIMIT 10`) as Record<string, unknown>[];

  // 顺手把六位验证码抽出来，省得调用方自己解析
  const withCode = rows.map((r) => ({
    ...r,
    code: (String(r.body_text ?? "").match(/\b(\d{6})\b/) ?? [])[1] ?? null,
  }));

  return NextResponse.json(
    { ok: true, count: withCode.length, messages: withCode },
    { headers: { "cache-control": "no-store" } }
  );
});

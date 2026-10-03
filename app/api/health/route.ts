import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { openErrorCount } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 只报「有没有」，绝不回显值 */
const REQUIRED = [
  "DATABASE_URL",
  "CLOUDFLARE_API_TOKEN",
  "CF_ACCOUNT_ID",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_APP_URL",
];
const OPTIONAL = [
  "STRIPE_WEBHOOK_SECRET",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "PSI_API",
  "ADMIN_SECRET",
  "SMTP_HOST",
  "SMTP_USER",
];

export async function GET() {
  const checks: Record<string, unknown> = {};
  let healthy = true;

  // 数据库
  const t0 = Date.now();
  try {
    await sql`SELECT 1`;
    checks.database = { ok: true, ms: Date.now() - t0 };
  } catch (e) {
    healthy = false;
    checks.database = { ok: false, error: (e as Error).message.slice(0, 160) };
  }

  // 环境变量：只报名字
  const missing = REQUIRED.filter((k) => !process.env[k]);
  const missingOptional = OPTIONAL.filter((k) => !process.env[k]);
  if (missing.length) healthy = false;
  checks.env = {
    ok: missing.length === 0,
    missingRequired: missing,
    missingOptional,
  };

  // Stripe 模式
  const sk = process.env.STRIPE_SECRET_KEY ?? "";
  checks.stripe = {
    configured: !!sk,
    mode: sk.includes("live") ? "live" : sk.includes("test") ? "test" : sk ? "restricted" : "none",
  };

  // 错误收件箱
  const open = await openErrorCount();
  if (open > 0) healthy = false;
  checks.errors = { openSevere: open };

  // 部署标识
  checks.deploy = {
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    env: process.env.VERCEL_ENV ?? "development",
    indexable: process.env.NEXT_PUBLIC_INDEXABLE === "1",
  };

  return NextResponse.json(
    { ok: healthy, at: new Date().toISOString(), checks },
    {
      status: healthy ? 200 : 503,
      headers: { "cache-control": "no-store, max-age=0" },
    }
  );
}

import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * R2 图片代理。走 Cloudflare REST，不需要在环境里放 S3 密钥。
 * 前缀白名单，防止被当成任意对象读取的口子：
 *   old/    旧站整页截图        shot/  设计稿截图
 *   og/     分享图              assets/ 从餐厅官网收来的照片（设计稿引用）
 */
const ALLOWED_PREFIX = /^(old|shot|og|assets)\//;

export async function GET(_req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await ctx.params;
  const key = parts.join("/");

  if (!ALLOWED_PREFIX.test(key) || key.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const account = process.env.CF_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const bucket = process.env.R2_BUCKET ?? "frontcanvas";
  if (!account || !token) return new NextResponse("Not configured", { status: 503 });

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${account}/r2/buckets/${bucket}/objects/${encodeURIComponent(key)}`;

  const r = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20000),
  }).catch(() => null);

  if (!r?.ok) return new NextResponse("Not found", { status: 404 });

  const buf = await r.arrayBuffer();
  const type = key.endsWith(".png") ? "image/png"
    : key.endsWith(".webp") ? "image/webp"
    : key.endsWith(".avif") ? "image/avif"
    : "image/jpeg";

  return new NextResponse(buf, {
    headers: {
      "content-type": type,
      // 截图内容不变，长缓存；换图会换 key
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

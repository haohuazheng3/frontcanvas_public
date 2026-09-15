import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * 全站边界：安全响应头 + 限流 + 开发期 noindex。
 *
 * 为什么必须放在这里：Cloudflare 走灰云（DNS-only，不代理），
 * 请求直接落到 Vercel —— 所以没有任何 WAF 在我们前面，
 * 头和限流只能由应用自己做。
 *
 * 地理信息读 Vercel 注入的 x-vercel-ip-* 头，转成 x-fc-* 传给下游。
 */

/* ── 环境 ────────────────────────────────────────────────────── */

const DEV = process.env.NODE_ENV !== "production";
/** 上线前全站 noindex，正式上线时把 NEXT_PUBLIC_INDEXABLE 置 1 */
const INDEXABLE = process.env.NEXT_PUBLIC_INDEXABLE === "1";

/* ── CSP ─────────────────────────────────────────────────────── */

const ANALYTICS = "https://flowglance.com";
/** snippet 从主域加载，但事件上报打的是 collect.flowglance.com */
const ANALYTICS_WILD = "https://*.flowglance.com";
/** development 实例用的共享域 */
const CLERK = "https://*.clerk.accounts.dev";
/**
 * production 实例改从**我们自己的子域**加载 clerk-js —— 这是 Clerk 生产模式的行为，
 * 漏了它整站的登录脚本会被 CSP 全部拦掉（实测过一次，页面看着正常但登录完全不工作）。
 */
const APP_HOST = (process.env.NEXT_PUBLIC_APP_URL ?? "https://frontcanvas.com").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
const CLERK_PROD = `https://clerk.${APP_HOST}`;
const CLERK_PORTAL = `https://accounts.${APP_HOST}`;
const CLERK_CDN = "https://*.clerk.com";
const CLERK_IMG = "https://img.clerk.com";
const TURNSTILE = "https://challenges.cloudflare.com";

interface CspOptions {
  /** /d/ 下的设计稿要能被 /p/ 页面同源 iframe 预览 */
  frameAncestors: "'none'" | "'self'";
  /** 设计稿里会嵌第三方图库的照片，主站不需要这么松 */
  anyImageHost: boolean;
}

function buildCsp({ frameAncestors, anyImageHost }: CspOptions): string {
  // Tailwind 的运行时样式与 Next 注入的内联脚本（RSC flight payload）都没有 nonce，
  // 全站静态渲染的前提下只能放 'unsafe-inline'。dev 的 HMR 另外需要 eval。
  const script = ["'self'", "'unsafe-inline'", ANALYTICS, ANALYTICS_WILD, CLERK, CLERK_PROD, CLERK_CDN, TURNSTILE];
  if (DEV) script.push("'unsafe-eval'");

  const connect = ["'self'", ANALYTICS, ANALYTICS_WILD, CLERK, CLERK_PROD, CLERK_PORTAL, CLERK_CDN];
  if (DEV) connect.push("ws:", "wss:");

  const img = ["'self'", "data:", "blob:", CLERK_IMG];
  if (anyImageHost) img.push("https:");

  const directives: [string, string[]][] = [
    ["default-src", ["'self'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
    ["object-src", ["'none'"]],
    ["frame-ancestors", [frameAncestors]],
    ["script-src", script],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["img-src", img],
    ["font-src", ["'self'", "data:"]],
    ["connect-src", connect],
    ["frame-src", ["'self'", CLERK, CLERK_PROD, CLERK_PORTAL, TURNSTILE]],
    ["worker-src", ["'self'", "blob:"]],
    ["media-src", ["'self'", "data:", "blob:"]],
    ["manifest-src", ["'self'"]],
  ];

  const out = directives.map(([k, v]) => `${k} ${v.join(" ")}`);
  if (!DEV) out.push("upgrade-insecure-requests");
  return out.join("; ");
}

// 只算两次，之后每个请求都是查表
const CSP_LOCKED = buildCsp({ frameAncestors: "'none'", anyImageHost: false });
const CSP_EMBEDDABLE = buildCsp({ frameAncestors: "'self'", anyImageHost: true });

/* ── 限流 ─────────────────────────────────────────────────────── */

interface Rule {
  /** 计数桶前缀，不同规则各算各的 */
  key: string;
  limit: number;
  windowMs: number;
}

const MINUTE = 60_000;

const RULE_TEST: Rule = { key: "test", limit: 5, windowMs: MINUTE };
const RULE_CONTACT: Rule = { key: "contact", limit: 5, windowMs: 10 * MINUTE };
const RULE_ERRORS: Rule = { key: "errors", limit: 30, windowMs: MINUTE };
const RULE_API: Rule = { key: "api", limit: 40, windowMs: MINUTE };

/** 清扫时的兜底窗口：取所有规则里最长的那个 */
const MAX_WINDOW_MS = 10 * MINUTE;

function ruleFor(pathname: string): Rule | null {
  if (pathname === "/api/_ratelimit-test") return RULE_TEST;
  if (pathname.startsWith("/api/contact")) return RULE_CONTACT;
  if (pathname.startsWith("/api/errors")) return RULE_ERRORS;
  if (pathname.startsWith("/api/")) return RULE_API;
  return null;
}

/**
 * 内存滑动窗口。
 *
 * 注意：这是**单实例近似** —— serverless 每个实例各有一份 Map，
 * 横向扩容后实际放行量约等于 limit × 实例数。它挡的是脚本刷接口和
 * 死循环打爆自己，不是分布式配额；真要精确得换 Redis/Upstash。
 */
const hits = new Map<string, number[]>();
const MAX_KEYS = 20_000;
let lastSweep = 0;

function sweep(now: number): void {
  if (now - lastSweep < MINUTE && hits.size < MAX_KEYS) return;
  lastSweep = now;
  for (const [k, stamps] of hits) {
    const last = stamps[stamps.length - 1];
    if (last === undefined || now - last > MAX_WINDOW_MS) hits.delete(k);
  }
  // 兜底：宁可短暂放行，也不让一次攻击把内存吃满
  if (hits.size > MAX_KEYS) hits.clear();
}

interface Verdict {
  ok: boolean;
  limit: number;
  remaining: number;
  /** 秒 */
  retryAfter: number;
  /** 窗口重置的绝对时间戳（秒） */
  reset: number;
}

function take(rule: Rule, ip: string, now: number): Verdict {
  sweep(now);

  const key = `${rule.key}:${ip}`;
  const cutoff = now - rule.windowMs;
  const prev = hits.get(key);
  // 只留还在窗口内的时间戳；数组长度永远不会超过 limit
  const stamps = prev ? prev.filter((t) => t > cutoff) : [];

  if (stamps.length >= rule.limit) {
    hits.set(key, stamps);
    const oldest = stamps[0]!;
    const resetMs = oldest + rule.windowMs;
    return {
      ok: false,
      limit: rule.limit,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((resetMs - now) / 1000)),
      reset: Math.ceil(resetMs / 1000),
    };
  }

  stamps.push(now);
  hits.set(key, stamps);
  const resetMs = stamps[0]! + rule.windowMs;
  return {
    ok: true,
    limit: rule.limit,
    remaining: rule.limit - stamps.length,
    retryAfter: 0,
    reset: Math.ceil(resetMs / 1000),
  };
}

/* ── 请求元信息 ───────────────────────────────────────────────── */

/**
 * 灰云意味着没有 cf-connecting-ip，链路是 客户端 → Vercel edge → 这里，
 * 所以第一跳就是 Vercel 自己写的，可信度够用。
 */
function clientIp(req: NextRequest): string {
  const h = req.headers;
  const first = (v: string | null) => v?.split(",")[0]?.trim() || "";
  return (
    first(h.get("x-vercel-forwarded-for")) ||
    h.get("x-real-ip")?.trim() ||
    first(h.get("x-forwarded-for")) ||
    "unknown"
  );
}

/** Vercel 的地理头是 URL 编码的（"New%20York"），解不开就原样留着 */
function decodeGeo(raw: string | null): string {
  if (!raw) return "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/* ── 响应头 ───────────────────────────────────────────────────── */

function applySecurityHeaders(headers: Headers, pathname: string): void {
  const embeddable = pathname.startsWith("/d/");

  headers.set("Content-Security-Policy", embeddable ? CSP_EMBEDDABLE : CSP_LOCKED);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  // /p/ 与 /d/ 是私下发给某一家餐厅看的，永远不进搜索引擎；
  // 其余路径在上线前统一 noindex（meta 之外的第二道保险，上线时摘 env 即可）。
  const alwaysPrivate = embeddable || pathname.startsWith("/p/");
  if (alwaysPrivate) {
    headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  } else if (!INDEXABLE) {
    headers.set("X-Robots-Tag", "noindex, nofollow");
  }
}

function applyRateHeaders(headers: Headers, v: Verdict): void {
  headers.set("X-RateLimit-Limit", String(v.limit));
  headers.set("X-RateLimit-Remaining", String(v.remaining));
  headers.set("X-RateLimit-Reset", String(v.reset));
}

/* ── 主体 ─────────────────────────────────────────────────────── */

function handle(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = clientIp(req);
  const rule = ruleFor(pathname);

  if (rule) {
    const verdict = take(rule, ip, Date.now());

    if (!verdict.ok) {
      const res = NextResponse.json(
        { ok: false, error: "rate_limited", retryAfter: verdict.retryAfter },
        { status: 429 }
      );
      res.headers.set("Retry-After", String(verdict.retryAfter));
      applyRateHeaders(res.headers, verdict);
      applySecurityHeaders(res.headers, pathname);
      res.headers.set("Cache-Control", "no-store");
      return res;
    }

    // 验收专用：这条路径没有 route handler，中间件直接答，方便打爆它看 429
    if (rule === RULE_TEST) {
      const res = NextResponse.json({ ok: true, remaining: verdict.remaining, limit: verdict.limit });
      applyRateHeaders(res.headers, verdict);
      applySecurityHeaders(res.headers, pathname);
      res.headers.set("Cache-Control", "no-store");
      return res;
    }

    const res = withGeo(req, ip);
    applyRateHeaders(res.headers, verdict);
    applySecurityHeaders(res.headers, pathname);
    return res;
  }

  const res = withGeo(req, ip);
  applySecurityHeaders(res.headers, pathname);
  return res;
}

/** 把 IP 与地理信息以 x-fc-* 的形式转给下游，页面用 headers() 就能读 */
function withGeo(req: NextRequest, ip: string): NextResponse {
  const headers = new Headers(req.headers);
  headers.set("x-fc-ip", ip);
  headers.set("x-fc-city", decodeGeo(req.headers.get("x-vercel-ip-city")));
  headers.set("x-fc-region", decodeGeo(req.headers.get("x-vercel-ip-country-region")));
  headers.set("x-fc-country", decodeGeo(req.headers.get("x-vercel-ip-country")));
  return NextResponse.next({ request: { headers } });
}

/**
 * Clerk 包在最外层：它负责在请求上挂 auth 上下文（受保护页面靠 auth() 读），
 * 我们自己的安全头 / 限流 / noindex 逻辑照原样在内层跑。
 * 这里不做任何路由拦截 —— 哪些页面要登录，由页面自己用 auth() 决定，
 * 这样退订这类必须匿名可达的路径不会被误伤。
 */
export default clerkMiddleware((_auth, req) => handle(req as NextRequest));

export const config = {
  // 静态产物与图标不需要走这一层
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg).*)"],
};

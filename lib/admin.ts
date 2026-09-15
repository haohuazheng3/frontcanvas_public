import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, timingSafeEqual } from "node:crypto";

/* ============================================================
   站长后台的门，两把钥匙各司其职：

   - ADMIN_PASSWORD —— 人用的登录口令，在 /admin 的表单里输。
     验证通过后把 ADMIN_SECRET 写进 HttpOnly cookie，口令本身
     不落地。机器端点不认它。
   - ADMIN_SECRET —— 强随机密钥，cookie 与 API（?k= / x-admin-key）
     的通行证。人不需要记它。

   这样即使登录口令是好记的短数字，API 面也不因此变弱。
   未登录访问 /admin 显示登录表单；访问子页则被送回 /admin。
   ============================================================ */

/** 放钥匙的 cookie 名 */
export const ADMIN_COOKIE = "fc_admin";
/** 放钥匙的 query 参数名 */
export const ADMIN_KEY_PARAM = "k";
/** 后台 fetch 带钥匙用的请求头 */
export const ADMIN_KEY_HEADER = "x-admin-key";

/** 所有 admin 页共用：绝不进索引、绝不进缓存 */
export const ADMIN_ROBOTS = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false },
} as const;

export type SearchParams = Record<string, string | string[] | undefined>;

export interface AdminSession {
  /**
   * 只有当钥匙是从 query 来的才有值。用于让后台内部链接继续带上 ?k=，
   * 以及让「Mark resolved」按钮能把钥匙发回来。
   * cookie 鉴权时这里是 null —— 钥匙一个字节都不下发到客户端。
   */
  key: string | null;
  /** true 表示这次是靠 URL 里的 ?k= 进来的 */
  fromQuery: boolean;
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * 常数时间比较。
 * 先各自 sha256 成定长 32 字节再 timingSafeEqual —— 这样长度不同也能比，
 * 且比较耗时不泄漏密钥长度（timingSafeEqual 本身要求等长）。
 */
function constantTimeEq(candidate: string, expected: string): boolean {
  const a = createHash("sha256").update(candidate, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export function secretMatches(candidate: string | null | undefined): boolean {
  const expected = process.env.ADMIN_SECRET;
  // 没配密钥就等于没有后台，任何输入都不放行
  if (!expected) return false;
  if (!candidate) return false;
  return constantTimeEq(candidate, expected);
}

/** 登录表单的口令。只在颁发 cookie 时用，绝不当 API 钥匙。 */
export function passwordMatches(candidate: string | null | undefined): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  if (!candidate) return false;
  return constantTimeEq(candidate, expected);
}

/**
 * 非抛出版：有会话给会话，没有给 null。/admin 首页用它来决定
 * 「渲染仪表盘」还是「渲染登录表单」。
 */
export async function getAdminSession(
  searchParams?: SearchParams | Promise<SearchParams>
): Promise<AdminSession | null> {
  // cookie 优先 —— 这样钥匙不必留在地址栏里
  const jar = await cookies();
  if (secretMatches(jar.get(ADMIN_COOKIE)?.value)) {
    return { key: null, fromQuery: false };
  }

  const sp = searchParams ? await searchParams : undefined;
  const fromQuery = first(sp?.[ADMIN_KEY_PARAM]);
  if (secretMatches(fromQuery)) {
    return { key: fromQuery ?? null, fromQuery: true };
  }

  return null;
}

/**
 * 子页面用：拿到 admin 会话，否则送回 /admin 登录。
 * searchParams 可以是 Next 给的 Promise，也可以是已经 await 过的对象。
 */
export async function requireAdmin(
  searchParams?: SearchParams | Promise<SearchParams>
): Promise<AdminSession> {
  const session = await getAdminSession(searchParams);
  if (session) return session;
  redirect("/admin");
}

/**
 * Route handler 用：从 header / query / body / cookie 里找钥匙。
 * 返回 boolean，由调用方决定回 404（推荐）还是 401。
 */
export async function adminRequestAllowed(req: Request, bodyKey?: string): Promise<boolean> {
  if (secretMatches(req.headers.get(ADMIN_KEY_HEADER))) return true;
  if (secretMatches(bodyKey)) return true;

  try {
    const q = new URL(req.url).searchParams.get(ADMIN_KEY_PARAM);
    if (secretMatches(q)) return true;
  } catch {
    /* URL 解析失败就当没带 */
  }

  const jar = await cookies();
  return secretMatches(jar.get(ADMIN_COOKIE)?.value);
}

/** 后台内部链接：query 鉴权时把钥匙带上，cookie 鉴权时保持干净 */
export function adminHref(path: string, session: AdminSession): string {
  if (!session.key) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${ADMIN_KEY_PARAM}=${encodeURIComponent(session.key)}`;
}

/* ── 展示用小工具（后台自己用，不外泄到营销页）───────────── */

const WHEN = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "Aug 14, 04:12 UTC" —— 固定时区，服务端渲染结果稳定可比对 */
export function fmtWhen(value: unknown): string {
  const d = toDate(value);
  return d ? `${WHEN.format(d)} UTC` : "—";
}

/** "3h ago" */
export function fmtAgo(value: unknown): string {
  const d = toDate(value);
  if (!d) return "—";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 0) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return `${Math.floor(s / 2592000)}mo ago`;
}

/** 两个时间戳之间的时长，给 cron 用 */
export function fmtDuration(from: unknown, to: unknown): string {
  const a = toDate(from);
  const b = toDate(to);
  if (!a || !b) return "—";
  const ms = b.getTime() - a.getTime();
  if (ms < 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.round((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

export function fmtInt(v: unknown): string {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n.toLocaleString("en-US") : "—";
}

/** numeric 列走 pg 会回字符串，这里统一收口 */
export function fmtDec(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? String(n) : "—";
}

/** jsonb 可能是已解析对象，也可能是字符串，两种都吃 */
export function parseJson(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;
  if (typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** jsonb 值渲染成一行短文本 */
export function shortValue(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "string") return v.length > 60 ? `${v.slice(0, 57)}…` : v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    const s = JSON.stringify(v);
    return s.length > 60 ? `${s.slice(0, 57)}…` : s;
  } catch {
    return "?";
  }
}

/** leads.status → Badge tone */
export const STATUS_TONE: Record<string, "neutral" | "accent" | "ok" | "warn" | "bad"> = {
  new: "neutral",
  audited: "neutral",
  designed: "accent",
  emailed: "accent",
  replied: "ok",
  won: "ok",
  dead: "bad",
  skipped: "warn",
};

/** pipeline 的自然顺序，用来给分组计数排序 */
export const STATUS_ORDER = [
  "new",
  "audited",
  "designed",
  "emailed",
  "replied",
  "won",
  "skipped",
  "dead",
] as const;

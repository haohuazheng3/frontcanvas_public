import { neon, neonConfig } from "@neondatabase/serverless";

// serverless 高并发下必须走 pooled 连接串（host 含 -pooler）
const url = process.env.DATABASE_URL;
if (!url) {
  // 构建期允许缺失，运行期首次查询才抛 —— 避免 build 直接崩
  console.warn("[db] DATABASE_URL 未设置");
} else if (!url.includes("-pooler")) {
  console.warn("[db] 警告：DATABASE_URL 不是 pooled 连接串，serverless 下会耗尽连接");
}

neonConfig.fetchConnectionCache = true;

export const sql = neon(url ?? "postgres://invalid");

/** 写后立刻读的场景（支付解锁、权益、退订）必须用它，绕开任何缓存层 */
export async function freshQuery<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  return (await sql(strings, ...values)) as T[];
}

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
/** 排序友好的短 id：时间前缀 + 随机后缀 */
export function newId(prefix = ""): string {
  const t = Date.now().toString(36).padStart(9, "0");
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const r = Array.from(bytes, (b) => ALPHABET[b % 36]).join("");
  return `${prefix}${t}${r}`;
}

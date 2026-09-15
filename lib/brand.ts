/**
 * 品牌名展示策略
 *
 * 2026-08-15 站长决定：**概念稿里完整展示餐厅店名，不再做字符遮蔽。**
 *
 * 早先这里把 "Mario's Trattoria" 遮成 "M×××o's Trattoria"，想的是不留可检索的全称。
 * 实跑下来两个问题：
 *   1. 遮蔽名出现在设计稿的 hero 大标题里非常难看，直接拖垮成品观感 ——
 *      而这份成品是整门生意唯一的销售材料。
 *   2. 在一个只发给餐厅本人、且永久 noindex 的私密页上使用他们自己的店名，
 *      本就属于名义性合理使用（nominative fair use）。那层遮蔽是过度保守。
 *
 * **另外两层保护保留，不要一并拆掉：**
 *   - slug 不含任何品牌线索（见 makeSlug）——URL 不可被猜测、不可被检索
 *   - /p/ 与 /d/ 永久 noindex（middleware 响应头 + robots.txt 双保险）
 *
 * 函数签名全部保留（调用点二十余处），方便日后一键改回遮蔽。
 */

/** 现在是恒等函数：完整返回店名 */
export function maskBrand(name: string): string {
  return name?.trim() ?? "";
}

/** 现在不做任何替换：正文里可以完整出现店名 */
export function scrubBrand(text: string, _realName: string): string {
  return text;
}

/** 现在不再拦截。保留签名，让调用点无需改动 */
export function assertNoBrandLeak(_text: string, _realName: string): void {
  /* 完整展示店名是当前策略，此处不做任何校验 */
}

/**
 * 无意义 slug —— 这一层**依然重要**：
 * URL 里不带品牌线索，别人猜不到、搜不到某家餐厅的概念稿地址。
 */
const SLUG_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // 去掉易混的 i/l/o/0/1
export function makeSlug(len = 9): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => SLUG_ALPHABET[b % SLUG_ALPHABET.length]).join("");
}

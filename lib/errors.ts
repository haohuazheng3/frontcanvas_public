import { sql, newId } from "./db";

export type Scope = "server" | "client" | "edge" | "cron";
export type Severity = "warn" | "error" | "fatal";

export interface ErrorInput {
  name?: string;
  message: string;
  stack?: string;
  route?: string;
  scope?: Scope;
  severity?: Severity;
  meta?: Record<string, unknown>;
}

/** 指纹 = 错误名 + 首帧堆栈 + 路由，同一个 bug 归一组而不是刷屏 */
function fingerprint(e: ErrorInput): string {
  const firstFrame =
    (e.stack ?? "")
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.startsWith("at ")) ?? "";
  const normalized = firstFrame
    .replace(/:\d+:\d+/g, "")
    .replace(/\?[a-z0-9=&]+/gi, "")
    .replace(/https?:\/\/[^/]+/g, "");
  return `${e.name ?? "Error"}|${normalized}|${e.route ?? ""}`.slice(0, 500);
}

/**
 * 写错误收件箱。这个函数自己绝不抛 —— 报错通道二次失败只写 console，
 * 不能让监控把主流程带崩。
 */
export async function reportError(input: ErrorInput): Promise<void> {
  try {
    const fp = fingerprint(input);
    await sql`
      INSERT INTO errors (id, fingerprint, name, message, stack, route, severity, scope, meta)
      VALUES (${newId("err_")}, ${fp}, ${input.name ?? "Error"}, ${input.message},
              ${input.stack ?? null}, ${input.route ?? null},
              ${input.severity ?? "error"}, ${input.scope ?? "server"},
              ${JSON.stringify(input.meta ?? {})}::jsonb)
      ON CONFLICT (fingerprint) DO UPDATE
        SET count = errors.count + 1,
            last_seen = now(),
            message = EXCLUDED.message,
            stack = COALESCE(EXCLUDED.stack, errors.stack),
            resolved = false,
            resolved_at = NULL
    `;
  } catch (e) {
    console.error("[errors] 写入失败（不影响主流程）", e);
  }
}

/** 包装 route handler：任何未捕获异常都进收件箱，绝不静默吞掉 */
export function withErrorReporting<T extends unknown[], R>(
  route: string,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (err) {
      const e = err as Error;
      await reportError({
        name: e?.name,
        message: e?.message ?? String(err),
        stack: e?.stack,
        route,
        scope: "server",
        severity: "error",
      });
      throw err;
    }
  };
}

export async function openErrorCount(): Promise<number> {
  try {
    const rows = (await sql`
      SELECT count(*)::int AS n FROM errors
      WHERE resolved = false AND severity IN ('error','fatal')
    `) as { n: number }[];
    return rows[0]?.n ?? 0;
  } catch {
    return -1;
  }
}

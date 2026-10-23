"use client";

import { useEffect } from "react";

/**
 * 客户端错误捕获 —— 未捕获异常与未处理的 Promise 拒绝都送进错误收件箱。
 * 本地去重，避免一个循环里的错误把库刷爆。
 */
export function ErrorBeacon() {
  useEffect(() => {
    const seen = new Set<string>();
    let sent = 0;
    const MAX_PER_PAGE = 12;

    const post = (payload: Record<string, unknown>) => {
      const key = `${payload.name}|${payload.message}`.slice(0, 200);
      if (seen.has(key) || sent >= MAX_PER_PAGE) return;
      seen.add(key);
      sent++;
      const body = JSON.stringify({ ...payload, route: location.pathname, scope: "client" });
      // sendBeacon 在页面卸载时也能送达
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/errors", new Blob([body], { type: "application/json" }));
      } else {
        fetch("/api/errors", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
      }
    };

    const onError = (e: ErrorEvent) => {
      post({
        name: e.error?.name ?? "Error",
        message: e.message || "Unknown client error",
        stack: e.error?.stack,
      });
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      post({
        name: r?.name ?? "UnhandledRejection",
        message: r?.message ?? String(r).slice(0, 500),
        stack: r?.stack,
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";

/**
 * 页面在浏览器里**可见满 2 秒**才回报一次「看过」。
 *
 * 不在服务端渲染时记：邮件网关会替收件人先抓一遍链接，那种访问不执行脚本、不停留。
 * 切到后台标签页会暂停计时，回来再重新计 2 秒。每次打开页面最多报一次。
 */
export function ViewBeacon({ slug, page = "p" }: { slug: string; page?: "p" | "d" }) {
  useEffect(() => {
    let sent = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const send = () => {
      if (sent || document.visibilityState !== "visible") return;
      sent = true;
      const body = JSON.stringify({ s: slug, p: page });
      try {
        const queued = navigator.sendBeacon?.("/api/view", new Blob([body], { type: "application/json" }));
        if (!queued) {
          void fetch("/api/view", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
        }
      } catch {
        /* 回报失败不影响看页面 */
      }
    };
    const arm = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(send, 2000);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") arm();
      else if (timer) clearTimeout(timer);
    };

    arm();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [slug, page]);

  return null;
}

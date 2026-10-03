"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/button";

/**
 * 站长点一下就把这条错误标成已解决。
 * Button 自己在 onClick 之前就切 pending —— 反馈不等接口。
 * adminKey 只有在「靠 ?k= 进来」时才有值；cookie 鉴权时是 null，
 * fetch 会自动带上同源 cookie，钥匙一个字节都不下发到浏览器。
 */
export function ResolveButton({ id, adminKey }: { id: string; adminKey?: string | null }) {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  async function resolve() {
    setFailed(false);
    try {
      const res = await fetch("/api/admin/resolve", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(adminKey ? { "x-admin-key": adminKey } : {}),
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      setDone(true);
      router.refresh();
    } catch {
      setFailed(true);
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-[var(--r-full)] bg-ok-soft px-3.5 py-2 text-[0.8rem] font-semibold text-ok">
        Resolved
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2.5">
      <Button variant="outline" size="sm" onClick={resolve} pendingLabel="Resolving">
        Mark resolved
      </Button>
      {failed ? (
        <span className="text-[0.78rem] font-medium text-bad">Did not stick — try again</span>
      ) : null}
    </span>
  );
}

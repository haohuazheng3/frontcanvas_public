"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/button";

/**
 * 站长打完电话点一下：这家标成「已联系」，不再收到自动跟进邮件。
 * 写法同 errors/resolve-button —— adminKey 只在「靠 ?k= 进来」时才有值，
 * cookie 鉴权时 fetch 自动带同源 cookie，钥匙不下发到浏览器。
 */
export function ContactedButton({ leadId, adminKey }: { leadId: string; adminKey?: string | null }) {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  async function mark() {
    setFailed(false);
    try {
      const res = await fetch("/api/admin/contacted", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(adminKey ? { "x-admin-key": adminKey } : {}),
        },
        body: JSON.stringify({ leadId }),
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
        已标记 · 不再自动跟进
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2.5">
      <Button variant="outline" size="sm" onClick={mark} pendingLabel="标记中">
        标记为已联系
      </Button>
      {failed ? <span className="text-[0.78rem] font-medium text-bad">没成功，再点一次</span> : null}
    </span>
  );
}

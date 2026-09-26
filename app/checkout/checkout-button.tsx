"use client";

import { useState } from "react";
import { Button } from "@/components/button";

export function CheckoutButton({
  tier,
  designSlug,
}: {
  tier: string;
  designSlug: string | null;
}) {
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setError(null);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier, designSlug }),
      });
      const j = await r.json();

      if (r.status === 401) {
        // 会话在这期间过期了 —— 回登录，登录完继续回来
        const back = `/checkout?tier=${tier}${designSlug ? `&d=${designSlug}` : ""}`;
        window.location.href = `/sign-in?redirect_url=${encodeURIComponent(back)}`;
        return;
      }
      if (!r.ok || !j.url) {
        setError("We could not start the payment. Please try again, or email contact@frontcanvas.com.");
        return;
      }
      window.location.href = j.url;
    } catch {
      setError("Something went wrong reaching our server. Please try again.");
    }
  }

  return (
    <>
      {/* 按下立刻进 pending —— 跳转 Stripe 要一两秒，这期间按钮不能像没反应 */}
      <Button onClick={go} size="lg" full pendingLabel="Taking you to Stripe">
        Continue to payment
      </Button>
      {error && (
        <p role="alert" className="mt-3 rounded-[var(--r-sm)] bg-bad-soft px-4 py-3 text-[0.85rem] text-bad">
          {error}
        </p>
      )}
    </>
  );
}

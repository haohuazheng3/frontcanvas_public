"use client";

import { useEffect, useRef } from "react";
import { Button, ButtonLink } from "@/components/button";
import { Card, Eyebrow } from "@/components/ui";

/** 与 site-footer 保持一致的对外联系地址（客户端组件不引服务端模块，避免打包进客户端） */
const CONTACT_EMAIL = "contact@frontcanvas.com";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // 同一个错误只上报一次（StrictMode 双次执行 / 重渲染都不会重复打点）
  const reported = useRef<string | null>(null);

  useEffect(() => {
    const key = `${error.name}|${error.message}|${error.digest ?? ""}`.slice(0, 300);
    if (reported.current === key) return;
    reported.current = key;

    const body = JSON.stringify({
      name: error.name || "Error",
      message: error.message || "Unhandled render error",
      stack: error.stack,
      route: window.location.pathname,
      scope: "client",
      severity: "fatal",
    });

    fetch("/api/errors", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      /* 报错通道自己失败时保持沉默，绝不把用户再带进一个错误 */
    });
  }, [error]);

  return (
    <div className="shell py-16 md:py-28">
      <Card size="xl" className="rise mx-auto max-w-[48rem] px-6 py-12 md:px-14 md:py-16">
        <Eyebrow>Something went wrong</Eyebrow>

        <h1 className="display mt-4 text-[2.1rem] text-ink md:text-[2.9rem]">
          This one is on us
        </h1>

        <p className="mt-5 max-w-[46ch] text-[1.05rem] leading-relaxed text-ink-2">
          The page stopped loading partway through. You didn&rsquo;t do anything wrong. We were told
          about it the moment it happened, and someone here will look at it.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={() => reset()} pendingLabel="Trying again">
            Try again
          </Button>
          <ButtonLink href="/" variant="outline" size="lg">
            Go to the homepage
          </ButtonLink>
        </div>

        <div className="mt-10 rounded-[var(--r-md)] bg-surface-inset px-5 py-4">
          <p className="max-w-[52ch] text-[0.9rem] leading-relaxed text-ink-2">
            If it happens again, email{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
                error.digest ? `Site error (ref ${error.digest})` : "Site error"
              )}`}
              className="font-medium text-accent underline underline-offset-[3px] hover:text-accent-hover"
            >
              {CONTACT_EMAIL}
            </a>
            . We answer within a business day.
          </p>
          {error.digest && (
            <p className="mt-3 text-[0.8rem] text-ink-3">
              Reference{" "}
              <code className="rounded-[var(--r-xs)] bg-surface px-1.5 py-0.5 font-mono text-[0.78rem] text-ink-2">
                {error.digest}
              </code>
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

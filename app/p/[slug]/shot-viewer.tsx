"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui";

type Tone = "neutral" | "accent" | "ok" | "warn" | "bad";

/* ── 全屏查看：截图是整页长图，裁切预览之外必须能看全 ───────────── */

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fade fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={alt}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close full-page view"
        className="absolute inset-0 h-full w-full cursor-zoom-out bg-void/85 backdrop-blur-sm"
      />
      <div className="relative mx-auto flex h-full max-w-[62rem] flex-col px-4 py-4 md:py-8">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="truncate text-[0.85rem] font-medium text-ink-2">{alt}</p>
          <button
            type="button"
            onClick={onClose}
            className="tap shrink-0 rounded-[var(--r-full)] bg-surface px-4 py-2 text-[0.82rem] font-semibold text-ink shadow-float-sm"
          >
            Close
          </button>
        </div>
        <div className="float-lg min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          <Image
            src={src}
            alt={alt}
            width={1280}
            height={3200}
            sizes="(min-width: 768px) 60rem, 100vw"
            className="h-auto w-full rounded-[var(--r-md)]"
          />
        </div>
      </div>
    </div>
  );
}

/* ── 前后对比的单块面板 ───────────────────────────────────────── */

/**
 * 一块截图面板。
 *
 * `liveUrl` 决定点击行为，这个区别很要紧：
 * - 新设计那一侧**必须**给 liveUrl，点进去是真页面 —— 能滚、能点导航、能看菜单。
 *   曾经这里两侧都只弹静态截图灯箱，整个展示页没有一个入口通向 `/d/<slug>`，
 *   老板顺着邮件点进来，最多只能看到一张不会动的长图。
 * - 旧站那一侧没有 liveUrl，保留灯箱 —— 我们不该把流量送回他们那个烂站。
 */
function Panel({
  src,
  alt,
  label,
  tone,
  note,
  onOpen,
  liveUrl,
}: {
  src: string | null;
  alt: string;
  label: string;
  tone: Tone;
  note?: string | null;
  onOpen: () => void;
  liveUrl?: string | null;
}) {
  const shot = src ? (
    <>
      <span className="relative block aspect-[16/12] w-full overflow-hidden bg-surface-inset">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover object-top"
        />
      </span>
      <span className="pointer-events-none absolute right-4 bottom-4 rounded-[var(--r-full)] bg-surface/90 px-3 py-1.5 text-[0.74rem] font-semibold text-ink shadow-float-sm backdrop-blur">
        {liveUrl ? "Open the whole page →" : "See the whole page"}
      </span>
    </>
  ) : null;

  return (
    <figure className="float overflow-hidden">
      <figcaption className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
        <Badge tone={tone}>{label}</Badge>
        {note ? <span className="text-[0.78rem] text-ink-3">{note}</span> : null}
      </figcaption>

      {!shot ? (
        <div className="grid aspect-[16/12] w-full place-items-center bg-surface-inset px-6 text-center text-[0.85rem] text-ink-3">
          No screenshot on file
        </div>
      ) : liveUrl ? (
        <a
          href={liveUrl}
          target="_blank"
          rel="noopener"
          aria-label={`Open the live page: ${alt}`}
          className="tap relative block w-full"
        >
          {shot}
        </a>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Open the full-page view of ${alt}`}
          className="tap relative block w-full cursor-zoom-in"
        >
          {shot}
        </button>
      )}
    </figure>
  );
}

/* ── 前后对比 ─────────────────────────────────────────────────── */

export function ShotCompare({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  beforeNote,
  liveUrl,
}: {
  beforeSrc: string | null;
  afterSrc: string | null;
  beforeAlt: string;
  afterAlt: string;
  beforeNote?: string | null;
  liveUrl?: string | null;
}) {
  const [open, setOpen] = useState<null | "before" | "after">(null);
  const close = useCallback(() => setOpen(null), []);

  const active =
    open === "before"
      ? { src: beforeSrc, alt: beforeAlt }
      : open === "after"
        ? { src: afterSrc, alt: afterAlt }
        : null;

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2 md:gap-7">
        <Panel
          src={beforeSrc}
          alt={beforeAlt}
          label="Your site today"
          tone="neutral"
          note={beforeNote}
          onOpen={() => setOpen("before")}
        />
        <Panel
          src={afterSrc}
          alt={afterAlt}
          label="What we drew for you"
          tone="accent"
          note="Concept — not live"
          onOpen={() => setOpen("after")}
          liveUrl={liveUrl}
        />
      </div>

      {active?.src ? <Lightbox src={active.src} alt={active.alt} onClose={close} /> : null}
    </>
  );
}

/* ── 手机外框预览（纯 CSS 的机身，不用图片素材）──────────────── */

export function PhoneShot({
  src,
  alt,
  liveUrl,
}: {
  src: string | null;
  alt: string;
  liveUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  const inner = src ? (
    <span className="relative block aspect-[9/19] w-full">
      <Image src={src} alt={alt} fill sizes="19rem" className="object-cover object-top" />
    </span>
  ) : null;

  return (
    <>
      <div className="mx-auto w-[16.75rem] md:w-[18.5rem]">
        <div className="rounded-[2.9rem] bg-surface p-3 shadow-float-xl">
          <div className="relative overflow-hidden rounded-[2.1rem] bg-surface-inset">
            <span
              aria-hidden="true"
              className="absolute top-2.5 left-1/2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-[var(--r-full)] bg-line-2"
            />
            {!inner ? (
              <div className="grid aspect-[9/19] w-full place-items-center px-6 text-center text-[0.85rem] text-ink-3">
                No screenshot on file
              </div>
            ) : liveUrl ? (
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener"
                aria-label={`Open the live page: ${alt}`}
                className="tap relative block w-full"
              >
                {inner}
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={`Open the full-page view of ${alt}`}
                className="tap relative block w-full cursor-zoom-in"
              >
                {inner}
              </button>
            )}
          </div>
        </div>
      </div>

      {open && src ? <Lightbox src={src} alt={alt} onClose={close} /> : null}
    </>
  );
}

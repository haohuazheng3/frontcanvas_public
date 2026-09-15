import type { ReactNode } from "react";

/* ── 版式 ─────────────────────────────────────────────── */

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.75rem] font-semibold uppercase tracking-[0.11em] text-accent">
      {children}
    </p>
  );
}

export function Section({
  eyebrow,
  title,
  sub,
  children,
  align = "left",
  className = "",
}: {
  eyebrow?: string;
  title?: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <section className={`shell py-16 md:py-24 ${className}`}>
      {(eyebrow || title || sub) && (
        <div className={`${centered ? "mx-auto max-w-[46rem] text-center" : "max-w-[46rem]"} mb-10 md:mb-14`}>
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          {title && (
            <h2 className={`display mt-3 text-[2rem] leading-[1.08] text-ink md:text-[2.9rem] ${centered ? "" : ""}`}>
              {title}
            </h2>
          )}
          {sub && (
            <p className={`mt-5 text-[1.05rem] leading-relaxed text-ink-2 ${centered ? "mx-auto max-w-[38rem]" : "max-w-[38rem]"}`}>
              {sub}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

/* ── 悬浮模块 ─────────────────────────────────────────── */

export function Card({
  children,
  className = "",
  hover = false,
  size = "md",
  as: Tag = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  as?: "div" | "article" | "li" | "section";
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">) {
  const float = { sm: "float-sm", md: "float", lg: "float-lg", xl: "float-xl" }[size];
  return (
    <Tag className={`${float} ${hover ? "float-hover" : ""} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "ok" | "warn" | "bad";
}) {
  const tones = {
    neutral: "bg-surface-inset text-ink-2",
    accent: "bg-accent-soft text-accent",
    ok: "bg-ok-soft text-ok",
    warn: "bg-warn-soft text-warn",
    bad: "bg-bad-soft text-bad",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-[var(--r-full)] px-3 py-1 text-[0.75rem] font-semibold ${tones}`}>
      {children}
    </span>
  );
}

/* ── 骨架屏 ───────────────────────────────────────────── */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2.5 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-3.5"
          style={{ width: i === lines - 1 ? "62%" : `${88 + ((i * 7) % 12)}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <Card className="p-6" aria-busy="true">
      <Skeleton className="h-40 w-full rounded-[var(--r-md)]" />
      <Skeleton className="mt-5 h-5 w-2/5" />
      <SkeletonText lines={2} className="mt-3.5" />
    </Card>
  );
}

/* ── 空态 ─────────────────────────────────────────────── */

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="px-8 py-16 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-[var(--r-md)] bg-surface-inset">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="2.5" y="2.5" width="11" height="11" rx="3.2" stroke="currentColor" strokeWidth="1.5" className="text-ink-3" />
          <rect x="8" y="8" width="9" height="9" rx="2.6" fill="currentColor" className="text-ink-4" />
        </svg>
      </div>
      <h3 className="display mt-5 text-[1.35rem] text-ink">{title}</h3>
      {body && <p className="mx-auto mt-2.5 max-w-[34ch] text-[0.95rem] leading-relaxed text-ink-2">{body}</p>}
      {action && <div className="mt-7">{action}</div>}
    </Card>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";

import { adminHref, type AdminSession } from "@/lib/admin";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/errors", label: "Errors" },
];

export function AdminHeader({
  session,
  active,
  title,
  sub,
}: {
  session: AdminSession;
  active: string;
  title: string;
  sub?: ReactNode;
}) {
  return (
    <header className="shell pt-8 pb-6 md:pt-12 md:pb-8">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-accent">
        Control room
      </p>
      <h1 className="display mt-2.5 text-[2rem] leading-[1.06] text-ink md:text-[2.6rem]">
        {title}
      </h1>
      {sub ? (
        <p className="mt-3 max-w-[46rem] text-[0.95rem] leading-relaxed text-ink-2">{sub}</p>
      ) : null}

      <nav className="mt-6 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const on = tab.href === active;
          return (
            <Link
              key={tab.href}
              href={adminHref(tab.href, session)}
              aria-current={on ? "page" : undefined}
              className={`tap rounded-[var(--r-full)] px-4 py-2 text-[0.85rem] font-semibold ${
                on
                  ? "bg-accent text-accent-ink shadow-float-accent"
                  : "bg-surface text-ink-2 shadow-float-sm hover:text-ink"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {session.fromQuery ? (
        <p className="mt-5 max-w-[46rem] text-[0.8rem] leading-relaxed text-ink-3">
          Your key is sitting in this URL, which means it is also in browser history and in any
          referrer this tab sends. Set the{" "}
          <code className="rounded-[var(--r-xs)] bg-surface-inset px-1.5 py-0.5 font-mono text-[0.75rem] text-ink-2">
            {"fc_admin"}
          </code>{" "}
          cookie on this domain to keep it out of the address bar.
        </p>
      ) : null}
    </header>
  );
}

/** 后台里所有外链统一长这样：新标签打开，按下立刻有反馈 */
export function AdminLink({
  href,
  children,
  tone = "neutral",
}: {
  href: string;
  children: ReactNode;
  tone?: "neutral" | "accent";
}) {
  const skin =
    tone === "accent"
      ? "bg-accent-soft text-accent"
      : "bg-surface-inset text-ink-2 hover:text-ink";
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`tap inline-flex max-w-full items-center gap-1.5 rounded-[var(--r-full)] px-3.5 py-2 text-[0.8rem] font-semibold break-all ${skin}`}
    >
      {children}
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M4 2.2h5.8V8M9.4 2.6 2.4 9.6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}

/** 查询整体挂掉时的提示条 —— 后台宁可显示「读不到」，也不要 500 */
export function AdminNotice({ children }: { children: ReactNode }) {
  return (
    <div className="float-sm p-5">
      <span className="inline-flex items-center gap-1.5 rounded-[var(--r-full)] bg-bad-soft px-3 py-1 text-[0.75rem] font-semibold text-bad">
        Could not read the database
      </span>
      <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-2">{children}</p>
    </div>
  );
}

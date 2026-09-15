"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./logo";

const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [lifted, setLifted] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 路由变化即关抽屉（状态本地切换，不等任何请求）
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-50 pt-3 md:pt-5">
        <div className="shell">
          <div
            className={`flex items-center justify-between gap-3 rounded-[var(--r-xl)] px-3 py-2.5 md:px-4 transition-all duration-300 ${
              lifted
                ? "bg-surface/85 shadow-float backdrop-blur-xl backdrop-saturate-150"
                : "bg-transparent shadow-none"
            }`}
          >
            <Link
              href="/"
              className="tap rounded-[var(--r-md)] px-1.5 py-1"
              aria-label="FrontCanvas — home"
            >
              <Logo size={26} />
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
              {NAV.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`tap rounded-[var(--r-full)] px-3.5 py-2 text-[0.875rem] font-medium ${
                      active ? "bg-surface-inset text-ink" : "text-ink-2 hover:bg-surface-inset hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/sign-in"
                className="tap hidden rounded-[var(--r-full)] px-3.5 py-2 text-[0.875rem] font-medium text-ink-2 hover:text-ink sm:block"
              >
                Sign in
              </Link>
              <Link
                href="/pricing"
                className="tap rounded-[var(--r-full)] bg-accent px-4 py-2.5 text-[0.875rem] font-semibold text-accent-ink shadow-float-accent hover:bg-accent-hover"
              >
                Get started
              </Link>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                className="tap -mr-1 grid size-10 place-items-center rounded-[var(--r-md)] text-ink hover:bg-surface-inset md:hidden"
              >
                <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d={open ? "M5 5l10 10M15 5L5 15" : "M3 6h14M3 13h14"}
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 移动端抽屉 —— 点击即开，不等任何数据 */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-void/70 backdrop-blur-sm"
          />
          <div className="shell absolute inset-x-0 top-[4.75rem]">
            <nav className="float-lg rise overflow-hidden p-2" aria-label="Mobile">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="tap block rounded-[var(--r-md)] px-4 py-3.5 text-[1rem] font-medium text-ink hover:bg-surface-inset"
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-2 h-px bg-line" />
              <Link
                href="/sign-in"
                className="tap block rounded-[var(--r-md)] px-4 py-3.5 text-[1rem] font-medium text-ink-2 hover:bg-surface-inset"
              >
                Sign in
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

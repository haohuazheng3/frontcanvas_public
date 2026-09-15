"use client";

import Link from "next/link";
import { useState, type ReactNode, type MouseEvent } from "react";

type Variant = "primary" | "soft" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink shadow-float-accent hover:bg-accent-hover",
  soft: "bg-accent-soft text-accent hover:bg-accent-soft/70",
  ghost: "text-ink-2 hover:bg-surface-inset hover:text-ink",
  outline: "bg-surface text-ink shadow-float-sm hover:shadow-float",
};

const SIZES: Record<Size, string> = {
  sm: "px-3.5 py-2 text-[0.85rem]",
  md: "px-5 py-3 text-[0.925rem]",
  lg: "px-7 py-4 text-[1rem]",
};

function classes(variant: Variant, size: Size, full?: boolean) {
  return [
    "tap inline-flex items-center justify-center gap-2 rounded-[var(--r-full)] font-semibold",
    VARIANTS[variant],
    SIZES[size],
    full ? "w-full" : "",
  ].join(" ");
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  full,
  className = "",
  onClick,
  type = "button",
  disabled,
  /** 点击后立刻进入 pending —— 状态本地切换，绝不等接口返回 */
  pendingLabel,
  ...rest
}: {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  full?: boolean;
  className?: string;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  type?: "button" | "submit";
  disabled?: boolean;
  pendingLabel?: string;
} & Record<string, unknown>) {
  const [pending, setPending] = useState(false);

  async function handle(e: MouseEvent<HTMLButtonElement>) {
    if (pending || disabled) return;
    if (!onClick) return;
    setPending(true); // 先切状态，再做事
    try {
      await onClick(e);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type={type}
      disabled={disabled || pending}
      onClick={handle}
      className={`${classes(variant, size, full)} ${className}`}
      {...rest}
    >
      {pending && (
        <svg className="spin size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.2" />
          <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  variant = "primary",
  size = "md",
  full,
  className = "",
  ...rest
}: {
  children: ReactNode;
  href: string;
  variant?: Variant;
  size?: Size;
  full?: boolean;
  className?: string;
} & Record<string, unknown>) {
  const external = /^https?:\/\//.test(href) || href.startsWith("mailto:");
  const cls = `${classes(variant, size, full)} ${className}`;

  if (external) {
    return (
      <a href={href} className={cls} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}

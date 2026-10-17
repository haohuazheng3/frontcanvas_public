"use client";

import { useSyncExternalStore } from "react";

type Theme = "system" | "light" | "dark";

const ORDER: Theme[] = ["system", "light", "dark"];
const STORAGE_KEY = "fc-theme";

const LABEL: Record<Theme, string> = {
  system: "match your device",
  light: "light",
  dark: "dark",
};

/**
 * 首屏防闪：这段脚本随 HTML 流到此处即同步执行，早于首次绘制，
 * 所以记着 light/dark 的用户不会先看到另一套配色再跳过来。
 * 它只改 <html> 的 data-theme —— React 不托管这个属性，不会有 hydration 冲突。
 * （globals.css 的约定：没有 data-theme = 跟随系统，light/dark = 强制。）
 */
const NO_FLASH = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}"),r=document.documentElement;if(t==="light"||t==="dark"){r.dataset.theme=t}else{delete r.dataset.theme}}catch(e){}})()`;

/* ── 外部存储：localStorage + <html data-theme> ──────────── */

const listeners = new Set<() => void>();
let current: Theme | null = null;

function normalize(value: string | null): Theme {
  return value === "light" || value === "dark" ? value : "system";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
}

function getSnapshot(): Theme {
  if (current === null) {
    try {
      current = normalize(localStorage.getItem(STORAGE_KEY));
    } catch {
      current = "system"; // 隐私模式下读不到 —— 那就一直跟随系统
    }
  }
  return current;
}

/** 服务端与 hydration 首帧一律按 system 渲染，两边一致；真实值在水合后补上 */
function getServerSnapshot(): Theme {
  return "system";
}

function onStorage(e: StorageEvent) {
  if (e.key !== STORAGE_KEY) return;
  current = normalize(e.newValue);
  applyTheme(current);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function setTheme(theme: Theme) {
  current = theme;
  applyTheme(theme); // 先落 DOM —— 点击当帧就换色，不等 React 走完一轮
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* 存不下也无妨，本次会话依然生效 */
  }
  listeners.forEach((l) => l());
}

/* ── 图标 ─────────────────────────────────────────────── */

function Icon({ theme }: { theme: Theme }) {
  if (theme === "light") {
    return (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="3.6" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M10 1.6v2.1M10 16.3v2.1M18.4 10h-2.1M3.7 10H1.6M15.94 4.06l-1.49 1.49M5.55 14.45l-1.49 1.49M15.94 15.94l-1.49-1.49M5.55 5.55 4.06 4.06"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (theme === "dark") {
    return (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M16.5 12.4A7 7 0 0 1 7.6 3.5a7 7 0 1 0 8.9 8.9Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // system —— 一半亮一半暗的圆，一眼看懂「跟着设备走」
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 3a7 7 0 0 1 0 14V3Z" fill="currentColor" />
    </svg>
  );
}

/* ── 组件 ─────────────────────────────────────────────── */

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
      <button
        type="button"
        onClick={() => setTheme(next)}
        aria-label={`Appearance: ${LABEL[theme]}. Switch to ${LABEL[next]}.`}
        title={`Appearance: ${LABEL[theme]}`}
        className={`tap grid size-10 place-items-center rounded-[var(--r-md)] text-ink-2 hover:bg-surface-inset hover:text-ink ${className}`}
      >
        <Icon theme={theme} />
      </button>
      <span aria-live="polite" className="sr-only">
        Appearance set to {LABEL[theme]}
      </span>
    </>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/button";

/**
 * Cookie 同意条。
 *
 * 原则：
 * - 默认什么都不勾选、什么都不开。没做选择之前 = 拒绝。
 * - 两个按钮同等清晰，没有「稍后再说」这种把人耗在原地的第三条路。
 * - 点击立刻消失（乐观更新），写入 localStorage 是之后的事。
 * - 浏览器发了 Global Privacy Control 信号，就直接当作「只用必要的」，连条都不弹。
 *
 * 选择结果对外暴露三种方式，方便分析脚本自行判断：
 *   1. localStorage[COOKIE_CHOICE_KEY] = "necessary" | "all"
 *   2. <html data-fc-analytics="on" | "off">
 *   3. window 上派发 CustomEvent(COOKIE_CHOICE_EVENT, { detail: { choice } })
 */

export const COOKIE_CHOICE_KEY = "fc-cookie-choice";
export const COOKIE_CHOICE_EVENT = "fc:cookie-choice";

export type CookieChoice = "necessary" | "all";

function readChoice(): CookieChoice | null {
  try {
    const raw = window.localStorage.getItem(COOKIE_CHOICE_KEY);
    return raw === "necessary" || raw === "all" ? raw : null;
  } catch {
    // Safari 无痕模式等场景下 localStorage 会抛错 —— 当作没选过，但不要崩
    return null;
  }
}

/** 分析脚本可以调用它来决定要不要初始化 */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  return readChoice() === "all";
}

type FlowGlance = { optIn?: () => void; optOut?: () => void };

function applyChoice(choice: CookieChoice) {
  const on = choice === "all";

  if (typeof document !== "undefined") {
    document.documentElement.dataset.fcAnalytics = on ? "on" : "off";
  }

  // 分析脚本可能已经加载了 —— 尽力通知它开或关
  const fg = (window as unknown as { flowglance?: FlowGlance }).flowglance;
  try {
    if (on) fg?.optIn?.();
    else fg?.optOut?.();
  } catch {
    // 第三方脚本的问题不该影响页面
  }

  window.dispatchEvent(new CustomEvent(COOKIE_CHOICE_EVENT, { detail: { choice } }));
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = readChoice();

    if (stored) {
      applyChoice(stored);
      return;
    }

    // 尊重 Global Privacy Control：不弹条，直接按拒绝处理
    const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl;
    if (gpc === true) {
      applyChoice("necessary");
      try {
        window.localStorage.setItem(COOKIE_CHOICE_KEY, "necessary");
      } catch {
        // 存不下就算了，下次访问再判断一次，结果一样
      }
      return;
    }

    // 没选过：默认关闭，稍等一拍再出现，别和首屏内容抢注意力
    applyChoice("necessary");
    const t = window.setTimeout(() => setVisible(true), 700);
    return () => window.clearTimeout(t);
  }, []);

  const choose = useCallback((choice: CookieChoice) => {
    setVisible(false); // 先消失，绝不等任何事
    try {
      window.localStorage.setItem(COOKIE_CHOICE_KEY, choice);
    } catch {
      // 同上：存不下不影响本次会话的选择生效
    }
    applyChoice(choice);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie choices"
      className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 md:px-6"
    >
      <div className="mx-auto w-full max-w-[1180px]">
        <div className="rise float-lg pointer-events-auto w-full p-5 md:ml-0 md:max-w-[30rem] md:p-6">
          <h2 className="display text-[1.15rem] leading-[1.25] text-ink">
            Cookies and session recording
          </h2>

          <p className="mt-2.5 text-[0.9rem] leading-relaxed text-ink-2">
            A couple of essentials keep you signed in. Beyond that, our analytics records how a visit
            goes — including text typed into forms here and images uploaded through them. Nothing is
            recorded until you say yes.
          </p>

          <Link
            href="/privacy"
            className="tap mt-3 inline-block text-[0.85rem] font-medium text-accent hover:text-accent-hover"
          >
            Read the privacy policy
          </Link>

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              full
              onClick={() => choose("necessary")}
              className="sm:flex-1"
            >
              Only what’s necessary
            </Button>
            <Button
              variant="primary"
              size="sm"
              full
              onClick={() => choose("all")}
              className="sm:flex-1"
            >
              Accept all
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;

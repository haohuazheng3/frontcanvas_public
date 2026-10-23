"use client";

import { useEffect } from "react";

/**
 * 从设计稿底部横条点「I want this site / See price」过来时，URL 带 #interest / #pricing。
 * 浏览器原生会滚到锚点，但有两种情况会落空：
 *   - 意向表单水合后从骨架换成真表单，高度一变，下面的 #pricing 就错位了
 *   - 后台打开的标签页、部分 App 内置浏览器不执行首屏锚点滚动
 * 这是整条转化路径上最关键的一跳，所以水合后再对一次位。
 * 只在目标明显不在视口顶部时才动；用户自己滚过就不再插手。
 */
export function HashScroll() {
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;

    let userScrolled = false;
    const onUser = () => {
      userScrolled = true;
    };
    window.addEventListener("wheel", onUser, { passive: true });
    window.addEventListener("touchmove", onUser, { passive: true });

    const align = () => {
      if (userScrolled) return;
      const el = document.getElementById(id);
      if (!el) return;
      // Section 带 scroll-mt-20（80px），对齐后目标顶边应在 80px 附近
      if (Math.abs(el.getBoundingClientRect().top - 80) > 40) {
        el.scrollIntoView({ block: "start", behavior: "instant" });
      }
    };
    const t1 = setTimeout(align, 150);
    const t2 = setTimeout(align, 900); // 图片、字体落定后再对一次

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("wheel", onUser);
      window.removeEventListener("touchmove", onUser);
    };
  }, []);

  return null;
}

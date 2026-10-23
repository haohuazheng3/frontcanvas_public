/**
 * FrontCanvas 标识
 *
 * 概念：一张画布（描边方框），一块模块从它的右下角浮出来。
 * 既是品牌名的字面意思，也是整站设计语言（悬浮模块）本身。
 * 两个形状而已 —— 16px favicon 下依然清晰，黑白单色下依然成立。
 */

export function LogoMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* 画布：模块浮出的地方被挖空，产生真实的前后层次 */}
      <mask id="fc-canvas-mask">
        <rect width="32" height="32" fill="white" />
        <rect x="13.4" y="13.4" width="17.2" height="17.2" rx="6.2" fill="black" />
      </mask>
      <rect
        x="2.6"
        y="2.6"
        width="21.4"
        height="21.4"
        rx="6.4"
        stroke="currentColor"
        strokeWidth="2.7"
        mask="url(#fc-canvas-mask)"
      />
      {/* 浮出的模块 */}
      <rect x="15.6" y="15.6" width="13.8" height="13.8" rx="4.6" fill="var(--accent, #c2410c)" />
    </svg>
  );
}

export function Logo({
  size = 28,
  className = "",
  showWordmark = true,
}: {
  size?: number;
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-[0.5rem] ${className}`}>
      <LogoMark size={size} className="text-ink shrink-0" />
      {showWordmark && (
        <span
          className="display text-ink"
          style={{ fontSize: size * 0.72, letterSpacing: "-0.028em" }}
        >
          FrontCanvas
        </span>
      )}
    </span>
  );
}

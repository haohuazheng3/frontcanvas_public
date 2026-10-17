/**
 * 全站默认 OG 图（1200×630）。
 *
 * 不引用任何外部字体或图片 —— 一张 OG 图在别人的服务器上被抓取时，
 * 任何外链都可能超时，让整张图渲染失败。这里只用色块、圆角和文字，
 * 字体走 next/og 自带的兜底字体。
 *
 * 构图就是品牌标识本身：一张画布（描边方框），一块橘色模块从右下角
 * 浮出来 —— 与 components/logo.tsx 同一个概念，也与全站「悬浮模块 +
 * 模块外一片虚无」的设计语言一致。
 *
 * satori 的限制：凡是有多个子节点的容器都必须显式写 display: "flex"。
 */

import { ImageResponse } from "next/og";

export const alt = "FrontCanvas — Restaurant websites worth walking into";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* 这里必须写死颜色：OG 图在别人的服务器上渲染，读不到 globals.css 的 token。
   取值与 app/globals.css 里的深色底与 accent 保持一致。 */
const INK = "#faf9f7";
const INK_DIM = "#a8a29e";
const PAPER = "#0b0a09";
const ACCENT = "#f97316";
const LINE = "#2a2724";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: PAPER,
          padding: "76px 80px",
        }}
      >
        {/* 品牌行：标识 + 字标 */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* 标识：画布 + 浮出的模块 */}
          <div
            style={{
              position: "relative",
              display: "flex",
              width: 74,
              height: 74,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 52,
                height: 52,
                borderRadius: 16,
                border: `6px solid ${INK}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 0,
                bottom: 0,
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: ACCENT,
                border: `5px solid ${PAPER}`,
              }}
            />
          </div>

          <div
            style={{
              marginLeft: 22,
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: INK,
            }}
          >
            FrontCanvas
          </div>
        </div>

        {/* 标题：两行，第二行落在 accent 上 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 88,
            fontWeight: 600,
            letterSpacing: "-0.035em",
            lineHeight: 1.08,
          }}
        >
          <div style={{ color: INK }}>Restaurant websites</div>
          <div style={{ color: ACCENT }}>worth walking into</div>
        </div>

        {/* 页脚行 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${LINE}`,
            paddingTop: 30,
            fontSize: 26,
            color: INK_DIM,
          }}
        >
          <div style={{ letterSpacing: "-0.01em" }}>
            We design it first. You only pay if you want it built.
          </div>
          <div style={{ color: INK, letterSpacing: "-0.01em" }}>frontcanvas.com</div>
        </div>
      </div>
    ),
    size,
  );
}

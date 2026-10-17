/**
 * Hero 里的前后对比 —— 纯 CSS 画的抽象网站预览，零图片素材。
 * 左边是我们每天在 Google Maps 上真实看到的那种餐厅官网：拥挤、灰、小字、塞满。
 * 右边是我们交付的那种：留白、层次、一眼看到菜单和地址。
 * 不声称是任何具体客户的案例 —— 它就是一张示意图。
 */

function Line({ w, dim = false }: { w: string; dim?: boolean }) {
  return (
    <div
      className={`h-[5px] rounded-full ${dim ? "bg-ink-4/35" : "bg-ink-3/50"}`}
      style={{ width: w }}
    />
  );
}

function OldSite() {
  return (
    <div className="relative h-full overflow-hidden rounded-[var(--r-md)] bg-[#e9e6e1] p-3 dark:bg-[#2a2622]">
      {/* 挤在一起的导航 */}
      <div className="flex items-center justify-between gap-1.5 border-b border-ink-4/25 pb-2">
        <div className="h-2.5 w-9 rounded-[2px] bg-ink-3/60" />
        <div className="flex gap-1">
          {[10, 8, 11, 7, 9].map((w, i) => (
            <div key={i} className="h-[4px] rounded-[1px] bg-ink-4/50" style={{ width: w }} />
          ))}
        </div>
      </div>
      {/* 小得可怜的主图 + 塞满的文字 */}
      <div className="mt-2.5 flex gap-2">
        <div className="h-12 w-16 shrink-0 rounded-[3px] bg-ink-4/30" />
        <div className="flex-1 space-y-[3px] pt-0.5">
          {["100%", "94%", "97%", "88%", "92%", "72%"].map((w, i) => (
            <div key={i} className="h-[3px] rounded-full bg-ink-4/40" style={{ width: w }} />
          ))}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-[3px] rounded-[3px] bg-ink-4/12 p-1.5">
            <div className="h-[3px] w-full rounded-full bg-ink-4/45" />
            <div className="h-[3px] w-4/5 rounded-full bg-ink-4/35" />
            <div className="h-[3px] w-3/5 rounded-full bg-ink-4/35" />
          </div>
        ))}
      </div>
      <div className="mt-2 space-y-[3px]">
        {["100%", "96%", "99%", "70%"].map((w, i) => (
          <div key={i} className="h-[3px] rounded-full bg-ink-4/35" style={{ width: w }} />
        ))}
      </div>
    </div>
  );
}

function NewSite() {
  return (
    <div className="relative h-full overflow-hidden rounded-[var(--r-md)] bg-surface p-3">
      {/* 呼吸感的导航 */}
      <div className="flex items-center justify-between">
        <div className="h-2.5 w-2.5 rounded-[3px] bg-accent" />
        <div className="flex gap-2.5">
          {[12, 10, 11].map((w, i) => (
            <Line key={i} w={`${w}px`} dim />
          ))}
        </div>
      </div>
      {/* 一张说话的大图 */}
      <div className="mt-3 h-[62px] rounded-[var(--r-sm)] bg-gradient-to-br from-accent/85 to-accent/45" />
      {/* 清晰的层次 */}
      <div className="mt-3 space-y-1.5">
        <div className="h-[7px] w-3/5 rounded-full bg-ink/70" />
        <Line w="82%" dim />
      </div>
      {/* 主行动按钮 —— 一眼看到 */}
      <div className="mt-3 flex gap-1.5">
        <div className="h-[15px] w-[52px] rounded-full bg-accent shadow-[0_2px_6px_-1px_rgb(194_65_12/.4)]" />
        <div className="h-[15px] w-[42px] rounded-full bg-surface-inset" />
      </div>
    </div>
  );
}

export function BeforeAfter() {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4">
      {[
        { label: "Most restaurant sites", node: <OldSite />, tone: "text-ink-3" },
        { label: "What we build", node: <NewSite />, tone: "text-accent" },
      ].map((col) => (
        <div key={col.label}>
          <p className={`mb-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.09em] ${col.tone}`}>
            {col.label}
          </p>
          <div className="aspect-[4/3.4]">{col.node}</div>
        </div>
      ))}
    </div>
  );
}

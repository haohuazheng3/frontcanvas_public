import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";

import { sql } from "@/lib/db";
import { scrubBrand } from "@/lib/brand";
import { TIERS, formatPrice, depositCents } from "@/lib/pricing";
import { Card, Eyebrow, Section } from "@/components/ui";
import { ButtonLink } from "@/components/button";
import { CONTACT_EMAIL } from "@/components/site-footer";
import { ShotCompare, PhoneShot } from "./shot-viewer";
import { InterestForm } from "./interest-form";
import { HashScroll } from "./hash-scroll";
import { ViewBeacon } from "./view-beacon";

/* 私下发给某一家餐厅看的页面：永远现取现渲染，绝不进构建产物、绝不进搜索引擎 */
export const dynamic = "force-dynamic";

/* ── 数据 ─────────────────────────────────────────────────────── */

interface Issue {
  code?: string;
  severity?: string;
  label?: string;
  detail?: string;
}

interface DesignRow {
  id: string;
  slug: string;
  headline: string | null;
  concept: string | null;
  shot_desktop_key: string | null;
  shot_mobile_key: string | null;
  og_key: string | null;
  /** 真名只在服务端停留，唯一用途是给对外文案做兜底洗名，绝不渲染、绝不下发客户端 */
  real_name: string;
  masked_name: string;
  city: string | null;
  state: string | null;
  cuisine: string | null;
  issues: unknown;
  psi_mobile: number | null;
  platform: string | null;
  old_shot_key: string | null;
}

/** generateMetadata 与页面各调一次，用 cache 去重成一次查询 */
const getDesign = cache(async (slug: string): Promise<DesignRow | null> => {
  try {
    const rows = (await sql`
      SELECT d.*,
             l.name AS real_name, l.masked_name, l.city, l.state, l.cuisine,
             a.badness, a.issues, a.psi_mobile, a.platform, a.old_shot_key
      FROM designs d
      JOIN leads l ON l.id = d.lead_id
      LEFT JOIN audits a ON a.lead_id = l.id
      WHERE d.slug = ${slug}
      ORDER BY a.audited_at DESC NULLS LAST
      LIMIT 1
    `) as DesignRow[];
    return rows[0] ?? null;
  } catch (err) {
    // 空库 / 未迁移 / 连接不可用时不要让整页 500，当作没有这份稿子
    console.error("[/p/[slug]] design query failed", err);
    return null;
  }
});

/** R2 对象走同源代理路由，key 不直接暴露成外链 */
function shotSrc(key: string | null | undefined): string | null {
  return key ? `/api/shot/${encodeURIComponent(key)}` : null;
}

function safe(text: string | null | undefined, realName: string): string | null {
  if (!text) return null;
  return scrubBrand(text, realName);
}

function parseIssues(raw: unknown): Issue[] {
  const list = typeof raw === "string" ? safeJson(raw) : raw;
  if (!Array.isArray(list)) return [];
  return list.filter((i): i is Issue => !!i && typeof i === "object");
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * 「你现在的站 → 新的站」对照。只挑**客人拿起手机就能感受到、而且我们测得准**的几类。
 *
 * 2026-10-15 以老板视角复盘：展示页曾把审计结果原样列成带「Serious / Small」红标的清单，
 * 外加一个红色测速分数。里面有错的（Flapjack 的 https 好好的，却写着 Not secure；
 * 403 多半是网站拦爬虫，却写成「打不开」「找不到菜单」），也有挑刺的（页脚年份、jQuery 版本、
 * 对热狗摊说「不能订座」）。老板只要发现一条不对，下面每一句都不会再信 —— 而且被一个陌生人打分，本身就不舒服。
 * 所以这里只说「新的会怎样」，最多点出三条他自己掏出手机就能验证的。
 */
const NOTICED: Record<string, { now: string; next: string }> = {
  no_viewport: {
    now: "On a phone, the site shows up as a shrunken desktop page, so people pinch and zoom to read it.",
    next: "Built for phones first, so everything is readable with one thumb.",
  },
  bad_viewport: {
    now: "On a phone, the site shows up as a shrunken desktop page, so people pinch and zoom to read it.",
    next: "Built for phones first, so everything is readable with one thumb.",
  },
  tiny_text: {
    now: "On a phone, a lot of the text is too small to read without zooming in.",
    next: "Comfortable, readable text on any phone.",
  },
  h_overflow: {
    now: "On a phone, the page slides sideways when people try to scroll down.",
    next: "Pages that fit the screen and scroll the way people expect.",
  },
  menu_pdf: {
    now: "The menu is a PDF, which is awkward to open and read on a phone.",
    next: "The whole menu as a real page, with prices, that opens instantly.",
  },
  no_website: {
    now: "Right now your online home is a Facebook or ordering page. Regulars find you fine, but someone new searching for you sees very little about the food or the place.",
    next: "A real website under your own name that anyone can open, with the menu, hours, and photos in one place.",
  },
  slow: {
    now: "The site takes a long time to appear on a phone.",
    next: "Built light, so it loads quickly even on a weak signal.",
  },
  slowish: {
    now: "The site is slow to appear on a phone.",
    next: "Built light, so it loads quickly even on a weak signal.",
  },
};

/** 这一家命中的对照，按出现顺序去重（no_viewport 与 bad_viewport 是一回事），最多三条 */
function pickNoticed(issues: Issue[]): { now: string; next: string }[] {
  const seen = new Set<string>();
  const out: { now: string; next: string }[] = [];
  for (const issue of issues) {
    const hit = issue.code ? NOTICED[issue.code] : undefined;
    if (!hit || seen.has(hit.next)) continue;
    seen.add(hit.next);
    out.push(hit);
    if (out.length === 3) break;
  }
  return out;
}

/** 每一份稿子都做到了的事 —— 设计任务的硬性要求，对谁说都是真的 */
const ALWAYS = [
  "Your whole menu, readable on a phone",
  "Call, directions, and hours on the first screen",
  "Food up front, the way people pick where to eat",
  "Fast and secure on any phone",
];

/** 老板最常问的几件事。答案与 /faq 一致，只是缩短、改成 Haohua 本人的口吻 —— 不在这里新增任何承诺 */
const OWNER_QUESTIONS: { q: string; a: string }[] = [
  {
    q: "Is this a scam?",
    a: "No. Nobody is asking you for money, a password, or a signature. It is one private link to a design I made for your restaurant. If you would rather not open links from someone you have never met, reply and I will send plain screenshots instead.",
  },
  {
    q: "Can I keep my domain, and the ordering system I already use?",
    a: "Yes. Your domain stays registered in your name; I just point it at the new site. If you take orders through Toast, Square, Clover or similar, the new site sends people straight into the system your kitchen already uses.",
  },
  {
    q: "Do I need to do anything technical?",
    a: "No. I need your current menu in whatever form it exists (a PDF, a photo of the printed card), your real hours, and any photos you like. Domains, hosting, and the rest are my problem.",
  },
  {
    q: "What if I am not happy with it?",
    a: "You have already seen the design, so there are no surprises. The deposit is fully refundable until building starts, and revisions are included.",
  },
  {
    q: "Who updates the menu later?",
    a: "Either you or me. I can set up a simple editor for you, or you send me the change however is easiest, a photo or a text, and it is live the same week.",
  },
  {
    q: "What if I am not interested?",
    a: "Then nothing happens. Reply \"no thanks\" or simply ignore it. This page stays private, and if you want it taken down, say so and it is gone the same day.",
  },
];

const PLATFORM_WORD: Record<string, string> = {
  wix: "Wix",
  squarespace: "Squarespace",
  wordpress: "WordPress",
  godaddy: "GoDaddy",
  weebly: "Weebly",
  custom: "a custom build",
  none: "no website builder we could identify",
};

/* ── metadata ─────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const row = await getDesign(slug);

  const noindex = {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  } as const;

  if (!row) {
    return { title: "Concept not found", robots: noindex };
  }

  // 对外的一切字段只用遮蔽名
  const name = row.masked_name;
  const title = `A new website for ${name}`;
  const description = `A free website concept made for ${name}. Nothing is live and nothing is owed.`;
  const og = shotSrc(row.og_key ?? row.shot_desktop_key);

  return {
    title,
    description,
    robots: noindex,
    openGraph: {
      type: "website",
      title,
      description,
      ...(og ? { images: [{ url: og, alt: `Website concept for ${name}` }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/* ── 小零件 ───────────────────────────────────────────────────── */

function Check() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="mt-[0.28rem] shrink-0 text-accent"
    >
      <path
        d="M3.2 8.4 6.3 11.5 12.8 5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TierCard({ tier, slug }: { tier: (typeof TIERS)[number]; slug: string }) {
  const featured = !!tier.featured;
  const price = formatPrice(tier.amountCents);
  const deposit = formatPrice(depositCents(tier));

  return (
    <Card
      as="li"
      size={featured ? "lg" : "md"}
      className={`flex flex-col p-6 md:p-8 ${featured ? "md:-mt-4 md:pb-10" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="display text-[1.5rem] text-ink">{tier.name}</h3>
      </div>
      <p className="mt-1.5 text-[0.9rem] text-ink-3">{tier.tagline}</p>

      <p className="mt-6 flex items-baseline gap-1.5">
        <span className="display text-[2.4rem] leading-none text-ink">{price}</span>
        <span className="text-[0.9rem] text-ink-3">
          {tier.interval === "month" ? "per month" : "one time"}
        </span>
      </p>
      <p className="mt-2 text-[0.85rem] text-ink-3">
        {tier.interval === "month"
          ? "Billed monthly. Stop whenever you like."
          : `${deposit} to start, the rest the day it goes live.`}
      </p>

      <p className="mt-5 text-[0.93rem] leading-relaxed text-ink-2">{tier.blurb}</p>

      <ul className="mt-6 flex-1 space-y-2.5">
        {tier.includes.map((line) => (
          <li key={line} className="flex gap-2.5 text-[0.9rem] leading-relaxed text-ink-2">
            <Check />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <ButtonLink
          href={`/checkout?tier=${tier.id}&d=${encodeURIComponent(slug)}`}
          variant={featured ? "primary" : "outline"}
          size="md"
          full
        >
          {tier.interval === "month" ? `Start ${tier.name}` : `Build it — ${tier.name}`}
        </ButtonLink>
      </div>
    </Card>
  );
}

/* ── 页面 ─────────────────────────────────────────────────────── */

export default async function DesignPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const row = await getDesign(slug);
  if (!row) notFound();

  const realName = row.real_name ?? "";
  const name = row.masked_name;
  const noticed = pickNoticed(parseIssues(row.issues));
  const platform = row.platform ? (PLATFORM_WORD[row.platform.toLowerCase()] ?? null) : null;

  // 设计思路只在真的写了一段话时才出现：只有标题（常常就是店名）的卡片看起来像没做完
  const concept = safe(row.concept, realName);

  const beforeSrc = shotSrc(row.old_shot_key);
  const afterSrc = shotSrc(row.shot_desktop_key);
  const mobileSrc = shotSrc(row.shot_mobile_key);

  // 真正的设计稿。这是整个页面上唯一有说服力的东西 ——
  // 截图只是引子，能滚能点的真页面才是我们卖的东西。
  const designUrl = `/d/${slug}`;

  const rawToken = sp?.t;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
  const unsubHref = token ? `/unsubscribe?t=${encodeURIComponent(token)}` : "/unsubscribe";

  return (
    <article>
      <ViewBeacon slug={slug} page="p" />
      <HashScroll />

      {/* 1 ── 开场：第一屏就让老板看见自己的新网站。
          2026-10-15 复盘：原来第一屏是一整墙字（"Made for you, unasked"），新网站要往下划才看得到 ——
          而那份稿子是整页唯一能打动人的东西。口吻与邮件一致：Haohua 本人在说话。 */}
      <header className="shell pt-8 pb-4 md:pt-14">
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16">
          <div className="rise max-w-[40rem]">
            <Eyebrow>A free concept for {name}</Eyebrow>
            <h1 className="display mt-4 text-[2.25rem] leading-[1.06] text-ink md:text-[3.3rem]">
              A new website for {name}
            </h1>
            <p className="mt-5 text-[1.05rem] leading-relaxed text-ink-2 md:text-[1.12rem]">
              I&apos;m Haohua, from FrontCanvas, a small web design studio in Michigan. I built this
              for {name} before asking you for anything.
            </p>
            <p className="mt-3 text-[1.05rem] leading-relaxed text-ink-2 md:text-[1.12rem]">
              It isn&apos;t live, nothing you own was touched, and looking costs nothing. Tap the
              phone to try it the way your customers would.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ButtonLink href={designUrl} variant="primary" size="md">
                Open the whole site
              </ButtonLink>
              <ButtonLink href="#interest" variant="outline" size="md">
                Ask me anything
              </ButtonLink>
            </div>
            <p className="mt-5 text-[0.85rem] text-ink-3">
              Free to look · Not live · A private link, hidden from search
            </p>
          </div>
          <PhoneShot src={mobileSrc} alt={`The new website for ${name}, on a phone`} liveUrl={designUrl} />
        </div>
      </header>

      {/* 2 ── 前后对比 */}
      <Section
        eyebrow="Side by side"
        title="Your site today, and the new one"
        sub="Same screen size, straight out of a browser, nothing retouched. Tap the new one to open it for real."
      >
        <ShotCompare
          beforeSrc={beforeSrc}
          afterSrc={afterSrc}
          beforeAlt={`The current website for ${name}`}
          afterAlt={`The new website for ${name}`}
          beforeNote={platform ? `Built on ${platform}` : null}
          liveUrl={designUrl}
        />
        {concept ? (
          <Card size="sm" className="mt-6 p-6 md:mt-8 md:p-8">
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-ink-3">
              What I was going for
            </p>
            <p className="mt-3 max-w-[52rem] text-[0.98rem] leading-relaxed text-ink-2">{concept}</p>
          </Card>
        ) : null}
      </Section>

      {/* 3 ── 新的会怎样（不再给老板的旧站打分） */}
      <Section
        eyebrow="What changes"
        title={`What the new site does for ${name}`}
        sub="Picture someone deciding where to eat tonight, on their phone. This is what they get."
      >
        <ul className="grid gap-3 sm:grid-cols-2 md:gap-4">
          {ALWAYS.map((line) => (
            <li key={line}>
              <Card size="sm" className="flex h-full gap-3 p-5">
                <Check />
                <span className="text-[0.95rem] leading-relaxed text-ink">{line}</span>
              </Card>
            </li>
          ))}
        </ul>

        {noticed.length > 0 ? (
          <div className="mt-8 md:mt-10">
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-ink-3">
              A few things I noticed on your current site
            </p>
            <ul className="mt-4 space-y-3">
              {noticed.map((n) => (
                <li key={n.next}>
                  <Card size="sm" className="grid gap-3 p-5 md:grid-cols-2 md:gap-8 md:p-6">
                    <p className="text-[0.93rem] leading-relaxed text-ink-2">
                      <span className="mb-1 block text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-ink-3">
                        Today
                      </span>
                      {n.now}
                    </p>
                    <p className="text-[0.93rem] leading-relaxed text-ink">
                      <span className="mb-1 block text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-accent">
                        In the new one
                      </span>
                      {n.next}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Section>

      {/* 4 ── 先聊聊：邮件是主渠道（2026-10-06 站长定），留电话是备选 */}
      <Section
        id="interest"
        eyebrow="Questions?"
        title="Just reply to my email"
        sub="Ask me anything: what it costs, how long it takes, what you would change, or whether it works with what you already use. It comes straight to me, not to a sales team. Prefer a call or a text? Leave your number below."
      >
        <InterestForm slug={slug} name={name} />
        <p className="mt-5 text-[0.9rem] text-ink-3">
          Lost the email? Write to{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`The new website for ${name}`)}`}
            className="font-medium text-accent underline underline-offset-[3px] hover:text-accent-hover"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>

      {/* 5 ── 老板最常问的（答案与 /faq 一致） */}
      <Section eyebrow="Fair questions" title="What owners usually ask first">
        <div className="max-w-[48rem] space-y-3">
          {OWNER_QUESTIONS.map((item) => (
            <details key={item.q} className="float-sm group p-5 md:p-6">
              <summary className="tap flex cursor-pointer list-none items-center justify-between gap-4 text-[1rem] font-semibold text-ink">
                {item.q}
                <span aria-hidden="true" className="text-ink-3 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-[0.93rem] leading-relaxed text-ink-2">{item.a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* 6 ── 报价：透明，但放在聊天之后 */}
      <Section
        id="pricing"
        eyebrow="If you want it built"
        title="What it costs"
        sub="Fixed prices, paid once: half to start, the rest the day it goes live. Questions first? Just reply to my email."
      >
        <ul className="grid gap-5 md:grid-cols-3 md:items-start md:gap-6">
          {TIERS.map((tier) => (
            <TierCard key={tier.id} tier={tier} slug={slug} />
          ))}
        </ul>
      </Section>

      {/* 7 ── 退订 */}
      <div className="shell pb-6">
        <p className="mx-auto max-w-[44rem] text-center text-[0.85rem] leading-relaxed text-ink-3">
          I wrote to you because I had already done the work. If you would rather not hear from me
          again,{" "}
          <Link
            href={unsubHref}
            className="font-medium text-ink-2 underline underline-offset-[3px] hover:text-ink"
          >
            unsubscribe here
          </Link>{" "}
          or reply &quot;stop&quot;. No reply needed.
        </p>
      </div>
    </article>
  );
}

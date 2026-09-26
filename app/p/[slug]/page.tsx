import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";

import { sql } from "@/lib/db";
import { scrubBrand } from "@/lib/brand";
import { TIERS, formatPrice, depositCents } from "@/lib/pricing";
import { Badge, Card, EmptyState, Eyebrow, Section } from "@/components/ui";
import { ButtonLink } from "@/components/button";
import { CONTACT_EMAIL } from "@/components/site-footer";
import { ShotCompare, PhoneShot } from "./shot-viewer";

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

const SEVERITY_TONE: Record<string, "bad" | "warn" | "neutral"> = {
  critical: "bad",
  fatal: "bad",
  severe: "bad",
  high: "bad",
  error: "bad",
  major: "bad",
  medium: "warn",
  moderate: "warn",
  warn: "warn",
  warning: "warn",
  low: "neutral",
  minor: "neutral",
  info: "neutral",
  notice: "neutral",
};

const SEVERITY_WORD: Record<string, string> = {
  critical: "Serious",
  fatal: "Serious",
  severe: "Serious",
  high: "Serious",
  error: "Serious",
  major: "Serious",
  medium: "Worth fixing",
  moderate: "Worth fixing",
  warn: "Worth fixing",
  warning: "Worth fixing",
  low: "Small",
  minor: "Small",
  info: "Small",
  notice: "Small",
};

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
  const description = `A concept we designed for ${name}, unasked and free to look at. Nothing is live and nothing is owed.`;
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

function SpeedCard({ score }: { score: number }) {
  const tone = score < 50 ? "bad" : score < 90 ? "warn" : "ok";
  const color = score < 50 ? "text-bad" : score < 90 ? "text-warn" : "text-ok";
  const word = score < 50 ? "Slow" : score < 90 ? "Middling" : "Fast";

  return (
    <Card size="sm" className="flex items-center gap-5 p-5 md:p-6">
      <div className="grid size-[4.5rem] shrink-0 place-items-center rounded-[var(--r-md)] bg-surface-inset">
        <span className={`display text-[1.7rem] leading-none ${color}`}>{score}</span>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[0.95rem] font-semibold text-ink">Speed on a phone</h3>
          <Badge tone={tone}>{word}</Badge>
        </div>
        <p className="mt-1.5 text-[0.9rem] leading-relaxed text-ink-2">
          Google scores every site out of 100 for how quickly it loads on a phone.{" "}
          {score < 50
            ? "Under 50 means a lot of people are gone before your menu ever appears."
            : score < 90
              ? "There is room here, and it is usually the cheapest thing to win back."
              : "This part is already in good shape."}
        </p>
      </div>
    </Card>
  );
}

function IssueCard({ issue, realName }: { issue: Issue; realName: string }) {
  const sev = (issue.severity ?? "").toLowerCase();
  const tone = SEVERITY_TONE[sev] ?? "neutral";
  const word = SEVERITY_WORD[sev] ?? "Noted";
  const label = safe(issue.label, realName) ?? issue.code ?? "Something to fix";
  const detail = safe(issue.detail, realName);

  return (
    <Card as="li" size="sm" className="p-5 md:p-6">
      <Badge tone={tone}>{word}</Badge>
      <h3 className="mt-3.5 text-[1rem] font-semibold text-ink">{label}</h3>
      {detail ? (
        <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-2">{detail}</p>
      ) : null}
    </Card>
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
        {featured ? <Badge tone="accent">Most restaurants pick this</Badge> : null}
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
  const place = [row.city, row.state].filter(Boolean).join(", ");
  const issues = parseIssues(row.issues);
  const psi = typeof row.psi_mobile === "number" ? row.psi_mobile : null;
  const platform = row.platform ? (PLATFORM_WORD[row.platform.toLowerCase()] ?? null) : null;

  const headline = safe(row.headline, realName);
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
      {/* 1 ── 开场 */}
      <header className="shell pt-10 pb-2 md:pt-16">
        <div className="rise max-w-[54rem]">
          <Eyebrow>Made for you, unasked</Eyebrow>
          <h1 className="display mt-4 text-[2.25rem] leading-[1.06] text-ink md:text-[3.4rem]">
            A new website for {name}
          </h1>
          <p className="mt-6 max-w-[44rem] text-[1.05rem] leading-relaxed text-ink-2 md:text-[1.15rem]">
            We are a small design studio in Michigan. We look for places where the
            food is plainly better than the website, and then we redesign one on our own time,
            before asking anybody for anything. Yours came up.
          </p>
          <p className="mt-4 max-w-[44rem] text-[1.05rem] leading-relaxed text-ink-2 md:text-[1.15rem]">
            Everything below is a concept we built for {name}. It is not live, we have not touched
            anything you own, and looking at it costs you nothing. If you want it made real, we will
            build it. If you do not, close this page and that is the end of it.
          </p>
        </div>

        <Card size="sm" className="mt-9 p-6 md:mt-11 md:p-8">
          <dl className="grid gap-6 sm:grid-cols-3">
            <div>
              <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-ink-3">
                What this is
              </dt>
              <dd className="mt-2 text-[0.93rem] leading-relaxed text-ink-2">
                A finished design concept, not a sales pitch with a mock-up attached.
              </dd>
            </div>
            <div>
              <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-ink-3">
                What it costs to look
              </dt>
              <dd className="mt-2 text-[0.93rem] leading-relaxed text-ink-2">
                Nothing. The work is already done and you have not paid for any of it.
              </dd>
            </div>
            <div>
              <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-ink-3">
                Who has seen it
              </dt>
              <dd className="mt-2 text-[0.93rem] leading-relaxed text-ink-2">
                Only us and you. This page is private and hidden from search engines.
              </dd>
            </div>
          </dl>
          {(place || row.cuisine) && (
            <div className="mt-7 flex flex-wrap gap-2">
              {place ? <Badge>{place}</Badge> : null}
              {row.cuisine ? <Badge>{row.cuisine}</Badge> : null}
              <Badge tone="accent">Concept — not live</Badge>
            </div>
          )}
        </Card>
      </header>

      {/* 2 ── 前后对比 */}
      <Section
        eyebrow="Side by side"
        title="What you have now, and what we drew"
        sub="Both are home pages at the same screen size, straight out of a browser. Nothing has been retouched. Tap the new one to open it for real — you can scroll it, tap through the menu, and try it on your phone."
      >
        <ShotCompare
          beforeSrc={beforeSrc}
          afterSrc={afterSrc}
          beforeAlt={`The current website for ${name}`}
          afterAlt={`Our website concept for ${name}`}
          beforeNote={platform ? `Built on ${platform}` : null}
          liveUrl={designUrl}
        />

        {/* 通往真页面的主入口。曾经整个展示页只有静态截图，
            老板顺着邮件点进来根本走不到 /d/ —— 那才是唯一有说服力的东西。 */}
        <div className="mt-6 flex flex-wrap items-center gap-4 md:mt-8">
          <ButtonLink href={designUrl} variant="primary" size="md" target="_blank" rel="noopener">
            Open the whole site
          </ButtonLink>
          <span className="text-[0.85rem] text-ink-3">
            Opens the real thing — scroll it, tap through the menu, try it on your phone.
          </span>
        </div>

        {(headline || concept) && (
          <Card size="sm" className="mt-6 p-6 md:mt-8 md:p-8">
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-ink-3">
              What we were going for
            </p>
            {headline ? (
              <p className="display mt-3 text-[1.5rem] leading-[1.2] text-ink md:text-[1.85rem]">
                {headline}
              </p>
            ) : null}
            {concept ? (
              <p className="mt-4 max-w-[52rem] text-[0.98rem] leading-relaxed text-ink-2">
                {concept}
              </p>
            ) : null}
          </Card>
        )}
      </Section>

      {/* 3 ── 我们发现的问题 */}
      <Section
        eyebrow="What we found"
        title="The things quietly turning people away"
        sub="None of this is about your food. It is about what a hungry stranger sees on a phone at six in the evening, and how fast they give up and pick somewhere else."
      >
        {psi !== null && (
          <div className="mb-6 max-w-[42rem]">
            <SpeedCard score={psi} />
          </div>
        )}

        {issues.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2 md:gap-5">
            {issues.map((issue, i) => (
              <IssueCard key={issue.code ?? `${issue.label ?? "issue"}-${i}`} issue={issue} realName={realName} />
            ))}
          </ul>
        ) : psi === null ? (
          <EmptyState
            title="Nothing logged here yet"
            body="We have not written up a formal list for this site. The comparison above is the honest version of it."
          />
        ) : null}

        <p className="mt-8 max-w-[44rem] text-[0.92rem] leading-relaxed text-ink-3">
          Every one of these is fixed in the concept you just looked at.
        </p>
      </Section>

      {/* 4 ── 手机端预览 */}
      <Section
        eyebrow="On a phone"
        title="Where your customers actually are"
        sub="Almost nobody looks up dinner sitting at a desk. This is the same concept at the size it will really be seen."
      >
        <PhoneShot
          src={mobileSrc}
          alt={`Our website concept for ${name}, on a phone`}
          liveUrl={designUrl}
        />
        <p className="mx-auto mt-8 max-w-[34rem] text-center text-[0.9rem] leading-relaxed text-ink-3">
          Menu, hours, phone number, and directions all reachable with one thumb.
        </p>
      </Section>

      {/* 5 ── 报价 */}
      <Section
        eyebrow="If you want it built"
        title="What it costs to make this real"
        sub="You have already seen the work, so there is nothing left to imagine. These are the only three ways to buy it."
      >
        <ul className="grid gap-5 md:grid-cols-3 md:items-start md:gap-6">
          {TIERS.map((tier) => (
            <TierCard key={tier.id} tier={tier} slug={slug} />
          ))}
        </ul>

        <Card size="sm" className="mt-8 p-6 md:p-8">
          <p className="max-w-[52rem] text-[0.95rem] leading-relaxed text-ink-2">
            Prices are fixed, not estimates. Nothing starts until you say so, and the concept above
            stays yours to think about for as long as you need. Questions, or something you would
            change first — write to{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-accent underline underline-offset-[3px] hover:text-accent-hover"
            >
              {CONTACT_EMAIL}
            </a>{" "}
            and a person answers.
          </p>
        </Card>
      </Section>

      {/* 6 ── 退订 */}
      <div className="shell pb-6">
        <p className="mx-auto max-w-[44rem] text-center text-[0.85rem] leading-relaxed text-ink-3">
          We wrote to you once because we had already done the work. If you would rather not hear
          from us again,{" "}
          <Link
            href={unsubHref}
            className="font-medium text-ink-2 underline underline-offset-[3px] hover:text-ink"
          >
            unsubscribe here
          </Link>{" "}
          and we will stop. No reply needed.
        </p>
      </div>
    </article>
  );
}

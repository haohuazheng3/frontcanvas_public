import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/button";
import { Badge, Card, Eyebrow, Section } from "@/components/ui";
import {
  DEPOSIT_RATIO,
  TIERS,
  depositCents,
  formatPrice,
  type Tier,
} from "@/lib/pricing";

/* 价格一律从 lib/pricing 读 —— 包括 meta description，避免两处数字打架 */
const PRICE_LINE = TIERS.map(
  (t) => `${t.name} ${formatPrice(t.amountCents)}${t.interval ? ` a ${t.interval}` : ""}`,
).join(", ");

const DEPOSIT_PCT = `${Math.round(DEPOSIT_RATIO * 100)}%`;
const ONE_TIME = TIERS.filter((t) => !t.interval);

export const metadata: Metadata = {
  title: "Pricing",
  description: `What a restaurant website costs, in plain numbers: ${PRICE_LINE}. We design the concept first and send it to you — you only pay if you decide to make it real.`,
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing — restaurant website design, priced plainly",
    description: `${PRICE_LINE}. The concept is free. You pay only if you want it built.`,
    url: "/pricing",
  },
};

/* ── 图标（内联，不引图标库）───────────────────────────── */

function Check() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="mt-[0.28em] shrink-0 text-accent"
    >
      <path
        d="M2.6 8.5 6 11.9l7.4-7.9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Dash() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="mt-[0.28em] shrink-0 text-ink-4"
    >
      <path d="M3.2 8h9.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Plus() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-ink-3 transition-transform duration-300 group-open:rotate-45"
    >
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/* ── 单档报价卡 ───────────────────────────────────────── */

function TierCard({ tier }: { tier: Tier }) {
  const featured = Boolean(tier.featured);
  const deposit = tier.interval ? null : depositCents(tier);
  const balance = deposit === null ? null : tier.amountCents - deposit;

  return (
    <Card
      as="article"
      size={featured ? "xl" : "lg"}
      className={`relative flex h-full flex-col p-7 ${
        featured ? "z-10 ring-1 ring-accent-line md:-my-6 md:p-10" : "md:p-8"
      }`}
    >
      {featured && (
        <div className="mb-5">
          <Badge tone="accent">Our recommendation</Badge>
        </div>
      )}
      <h2 className="display text-[1.6rem] text-ink md:text-[1.8rem]">{tier.name}</h2>
      <p className="mt-1.5 text-[0.925rem] leading-relaxed text-ink-2">{tier.tagline}</p>

      <div className="mt-7 flex items-baseline gap-1.5">
        <span className="display text-[2.6rem] text-ink md:text-[3rem]">
          {formatPrice(tier.amountCents)}
        </span>
        <span className="text-[0.9rem] font-medium text-ink-3">
          {tier.interval ? `per ${tier.interval}` : "one time"}
        </span>
      </div>

      {deposit !== null && balance !== null ? (
        <p className="mt-2.5 text-[0.85rem] leading-relaxed text-ink-3">
          {formatPrice(deposit)} to start, {formatPrice(balance)} when your site goes live.
        </p>
      ) : (
        <p className="mt-2.5 text-[0.85rem] leading-relaxed text-ink-3">
          Billed monthly. Cancel any time, no notice period.
        </p>
      )}

      <p className="mt-6 text-[0.95rem] leading-relaxed text-ink-2">{tier.blurb}</p>

      <ul className="mt-7 space-y-3 border-t border-line pt-7">
        {tier.includes.map((item) => (
          <li key={item} className="flex gap-2.5 text-[0.925rem] leading-relaxed text-ink-2">
            <Check />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-9 md:mt-auto md:pt-9">
        <ButtonLink
          href={`/checkout?tier=${tier.id}`}
          variant={featured ? "primary" : "outline"}
          size="lg"
          full
          aria-label={`Get started with ${tier.name}`}
        >
          Get started with {tier.name}
        </ButtonLink>
        <p className="mt-3 text-center text-[0.8rem] text-ink-3">
          {tier.interval ? "Starts the day your site goes live." : "No charge until you approve the concept."}
        </p>
      </div>
    </Card>
  );
}

/* ── 页面 ─────────────────────────────────────────────── */

const STEPS: { title: string; body: string }[] = [
  {
    title: "You see the concept",
    body: "We design a full version of your new site — your menu, your photos, your room — and email you the link. No card, no call, no obligation to reply.",
  },
  {
    title: `${DEPOSIT_PCT} to begin`,
    body: `If you want it built, ${DEPOSIT_PCT} of the project is due up front — ${ONE_TIME.map(
      (t) => `${formatPrice(depositCents(t))} on ${t.name}`,
    ).join(", ")}. That is what puts your build on the calendar.`,
  },
  {
    title: "The rest at launch",
    body: "You walk through the finished site on your own domain before the balance is due. If it is not right, it does not go live and you do not pay the second half.",
  },
];

const NOT_INCLUDED: string[] = [
  "A photo shoot. We work with the photos you already have, or license stock that fits. If your food deserves better pictures, we will say so and point you to a local photographer.",
  "A new logo or full brand identity. We will use yours carefully; designing one from scratch is a separate conversation.",
  "Printed menus, signage, or anything that goes on paper.",
  "Social media posting, ad campaigns, or review management.",
  "Third-party fees. Your ordering or reservation provider still bills you directly — we connect what you already pay for, we do not resell it.",
  "Domain and hosting after the first year, unless you are on Care.",
];

const NOT_A_FIT: string[] = [
  "You need it live this week. A build takes about two weeks, and we would rather lose the job than rush the part your customers actually see.",
  "You are happy with the site you have. We are not going to try to talk you out of it.",
  "You are a franchise whose site is controlled by corporate. We cannot touch that, and we will tell you on the first email.",
  "You want a dashboard to rebuild pages yourself every week. We build sites that stay finished; you send us the edit and we do it.",
  "Cheapest wins. A template builder costs less than we do, and for some restaurants that is genuinely the right call.",
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is the concept really free?",
    a: "Yes. We build it before we ever hear back from you, so there is nothing to sign up for and no card to enter. If you look at it and say no, you owe nothing and we stop emailing. That is the whole arrangement — we would rather show you the work than describe it.",
  },
  {
    q: `Why ${DEPOSIT_PCT} up front?`,
    a: `A build takes about two weeks of real work, and ${DEPOSIT_PCT} is what reserves that time. The balance is not due until the finished site is on your domain and you have clicked through it yourself. If we cannot get it to a place you are happy with, we refund the deposit and part ways.`,
  },
  {
    q: "Do I have to take Care?",
    a: "No. Launch and Complete are one-time projects and include your domain, SSL, and hosting for the first year. After that you can renew and maintain it yourself, hand it to whoever you like, or put it on Care and send us edits instead. Care can be cancelled any time.",
  },
  {
    q: "Who owns the site when we are done?",
    a: "You do. The domain is registered in your name, the site is yours, and if you ever leave we hand over the files and the accounts without a fight. We do not hold a restaurant's website hostage.",
  },
];

export default function PricingPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="shell pt-14 pb-4 md:pt-24">
        <div className="max-w-[46rem]">
          <Eyebrow>Pricing</Eyebrow>
          <h1 className="display mt-4 text-[2.4rem] leading-[1.05] text-ink md:text-[3.6rem]">
            You see the site before you pay for it.
          </h1>
          <p className="mt-6 max-w-[40rem] text-[1.08rem] leading-relaxed text-ink-2">
            We design a complete concept for your restaurant first and send it to you. Nothing on
            this page is owed unless you look at that concept and decide you want it built for real.
          </p>
        </div>

        <Card size="md" className="mt-10 flex flex-col gap-5 p-7 md:flex-row md:items-center md:gap-8 md:p-9">
          <div className="flex-1">
            <h2 className="display text-[1.35rem] text-ink">The concept is always free</h2>
            <p className="mt-2.5 text-[0.95rem] leading-relaxed text-ink-2">
              Not a trial, not a teaser, not a discovery call. A finished design of your new front
              page, built at our expense, in your hands before money is mentioned.
            </p>
          </div>
          <div className="shrink-0">
            <ButtonLink href="/how-it-works" variant="soft" size="md">
              How it works
            </ButtonLink>
          </div>
        </Card>
      </section>

      {/* ── 三档 ── */}
      <section className="shell py-14 md:py-20" aria-labelledby="plans-heading">
        <h2 id="plans-heading" className="sr-only">
          Plans and prices
        </h2>
        <div className="grid gap-7 md:grid-cols-3 md:gap-6 lg:gap-8">
          {TIERS.map((tier) => (
            <TierCard key={tier.id} tier={tier} />
          ))}
        </div>
        <p className="mt-10 text-center text-[0.875rem] text-ink-3">
          Prices are in US dollars. We are a small studio in Michigan, and we only take
          on a handful of builds at a time.
        </p>
      </section>

      {/* ── 定金 / 付款流程 ── */}
      <Section
        eyebrow="How payment works"
        title="Half to start. The rest when it is live."
        sub={`One-time projects are split down the middle: ${DEPOSIT_PCT} when you say go, the balance when the finished site is on your domain and you have seen it working.`}
      >
        <Card size="lg" className="p-7 md:p-11">
          <ol className="grid gap-9 md:grid-cols-3 md:gap-10">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <span
                  className="grid size-9 place-items-center rounded-[var(--r-full)] bg-accent-soft text-[0.9rem] font-semibold text-accent"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <h3 className="display mt-5 text-[1.2rem] text-ink">{step.title}</h3>
                <p className="mt-2.5 text-[0.94rem] leading-relaxed text-ink-2">{step.body}</p>
              </li>
            ))}
          </ol>
        </Card>
      </Section>

      {/* ── 诚实小节 ── */}
      <Section
        eyebrow="Before you decide"
        title="What the price does not cover, and when we are the wrong studio."
        sub="It is cheaper for both of us to find this out now than three emails in."
      >
        <div className="grid gap-6 md:grid-cols-2 md:gap-7">
          <Card size="lg" className="p-7 md:p-9">
            <h3 className="display text-[1.35rem] text-ink">Not included</h3>
            <ul className="mt-6 space-y-4">
              {NOT_INCLUDED.map((item) => (
                <li key={item} className="flex gap-2.5 text-[0.925rem] leading-relaxed text-ink-2">
                  <Dash />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card size="lg" className="p-7 md:p-9">
            <h3 className="display text-[1.35rem] text-ink">Do not hire us if</h3>
            <ul className="mt-6 space-y-4">
              {NOT_A_FIT.map((item) => (
                <li key={item} className="flex gap-2.5 text-[0.925rem] leading-relaxed text-ink-2">
                  <Dash />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section eyebrow="Questions about money" title="The things owners actually ask.">
        <div className="max-w-[46rem] space-y-3.5">
          {FAQS.map((f) => (
            <details key={f.q} className="group float-sm overflow-hidden">
              <summary className="tap flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-5 text-[1rem] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                <span>{f.q}</span>
                <Plus />
              </summary>
              <div className="px-6 pb-6 text-[0.94rem] leading-relaxed text-ink-2">{f.a}</div>
            </details>
          ))}
        </div>

        <p className="mt-8 max-w-[46rem] text-[0.925rem] leading-relaxed text-ink-3">
          Anything else, ask us directly at{" "}
          <Link
            href="/contact"
            className="font-medium text-accent underline underline-offset-[3px] hover:text-accent-hover"
          >
            the contact page
          </Link>
          . We answer within one business day, and we will tell you if the answer is no.
        </p>
      </Section>

      {/* ── 收尾 CTA ── */}
      <section className="shell pb-6">
        <Card size="xl" className="px-7 py-14 text-center md:px-12 md:py-20">
          <h2 className="display mx-auto max-w-[24ch] text-[2rem] leading-[1.08] text-ink md:text-[2.7rem]">
            Have not seen a concept for your restaurant yet?
          </h2>
          <p className="mx-auto mt-5 max-w-[40ch] text-[1.02rem] leading-relaxed text-ink-2">
            Tell us where you are and what you cook. If we think we can make your front page better,
            we will build one and send it over — before you have paid us anything.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/contact" variant="primary" size="lg">
              Ask for a concept
            </ButtonLink>
            <ButtonLink href="/how-it-works" variant="ghost" size="lg">
              See how it works
            </ButtonLink>
          </div>
        </Card>
      </section>
    </>
  );
}

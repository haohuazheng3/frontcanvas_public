import type { Metadata } from "next";
import { Card, Eyebrow, Section, Badge } from "@/components/ui";
import { ButtonLink } from "@/components/button";
import { CONTACT_EMAIL, POSTAL_ADDRESS } from "@/components/site-footer";

const SITE = process.env.NEXT_PUBLIC_APP_URL || "https://frontcanvas.com";

export const metadata: Metadata = {
  title: "About the studio",
  description:
    "FrontCanvas is a small design studio in Michigan that redesigns restaurant websites. We build the concept first, send it, and only charge if you want it made real.",
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    url: `${SITE}/about`,
    title: "About the studio · FrontCanvas",
    description:
      "A small design studio in Michigan. We redesign restaurant websites, and we show you the work before we ask for anything.",
  },
};

/* ── Organization JSON-LD ─────────────────────────────────
   只写确实为真的事实：实体名、网址、邮箱、通信地址、服务范围。
   不写成立年份、不写创始人、不写员工数 —— 无法证实的一律不写。 */
const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "FrontCanvas",
  url: SITE,
  email: CONTACT_EMAIL,
  description:
    "A design studio that redesigns restaurant websites. FrontCanvas builds a complete website concept for a restaurant first, sends it over, and charges only if the restaurant wants it built.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "3120 Oak Valley Dr",
    addressLocality: "Ann Arbor",
    addressRegion: "MI",
    postalCode: "48103",
    addressCountry: "US",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: CONTACT_EMAIL,
    areaServed: "US",
    availableLanguage: "English",
  },
  areaServed: [
    { "@type": "State", name: "Michigan" },
    { "@type": "Country", name: "United States" },
  ],
  knowsAbout: [
    "Restaurant website design",
    "Menu presentation",
    "Online ordering integration",
    "Local search for restaurants",
  ],
};

const BELIEFS: { title: string; body: string }[] = [
  {
    title: "The website is part of the meal",
    body: "A guest meets you on a phone screen long before they meet your host stand. If that screen is slow, cramped, or three years out of date, some of them quietly pick somewhere else. They never tell you, and you never see the reservation that did not happen.",
  },
  {
    title: "Show the work, then ask",
    body: "Anyone can promise a beautiful site over a phone call. We would rather build the thing and let you look at it. You decide with the finished design in front of you, not a description of one.",
  },
  {
    title: "A restaurant is not a software company",
    body: "You should not have to learn a dashboard to change a price. You should not have to open a support ticket to add a special. Send us the change the way you would text a friend, and it gets done.",
  },
  {
    title: "Plain language, always",
    body: "You will never get a document from us about headless architecture or conversion funnels. We talk about how the menu reads, how fast it opens on a five-year-old phone, and whether someone can find your hours in under three seconds.",
  },
];

const REFUSALS: { title: string; body: string }[] = [
  {
    title: "We do not cold-call, and we do not chase",
    body: "One concept, one short reminder, and then we stop. Every email we send has a working unsubscribe link, and using it removes you permanently.",
  },
  {
    title: "We do not publish your restaurant to the world",
    body: "The concepts we send are unsolicited, so they never appear in our portfolio, in search results, or anywhere else public. Each one lives at a random, unlisted address sent only to that restaurant, and it comes down on request. We ask before naming anyone as a client.",
  },
  {
    title: "We do not invent numbers",
    body: "No borrowed logos, no invented testimonials, no rounded-up client count. This studio is early, and pretending otherwise would be the first thing we lied to you about.",
  },
  {
    title: "We do not hold your site hostage",
    body: "The domain stays in your name. When the work is paid for, the site is yours — we will hand it to any developer you like, without a conversation about it.",
  },
  {
    title: "We do not take work outside restaurants",
    body: "Dentists, gyms, and law firms all need websites. They are not what we are good at. Doing one thing for one industry is the only reason we can move this fast.",
  },
];

const HOW: { step: string; title: string; body: string }[] = [
  {
    step: "01",
    title: "We find you",
    body: "We look for places where the cooking clearly outruns the website — strong reviews, a full room on a Friday, and a homepage that has not been touched since it was built.",
  },
  {
    step: "02",
    title: "We build it first",
    body: "We read your menu, look at your photos, and design a full concept for a new site. This happens before we have spoken to you, and it costs you nothing whether you reply or not.",
  },
  {
    step: "03",
    title: "We send it over",
    body: "One email with a private link. You open it on your phone between services and see exactly what your restaurant could look like. No call to book, no deck to sit through.",
  },
  {
    step: "04",
    title: "You decide",
    body: "If it is not for you, delete the email. If it is, we make it real and put it on your own domain, usually inside two weeks.",
  },
];

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSONLD) }}
      />

      {/* ── 开场 ───────────────────────────────────────── */}
      <section className="shell pt-14 pb-4 md:pt-24 md:pb-8">
        <div className="max-w-[46rem]">
          <Eyebrow>The studio</Eyebrow>
          <h1 className="display mt-4 text-[2.35rem] leading-[1.06] text-ink md:text-[3.4rem]">
            A design studio that works on restaurants, and nothing else.
          </h1>
          <p className="mt-6 max-w-[40rem] text-[1.08rem] leading-relaxed text-ink-2 md:text-[1.15rem]">
            FrontCanvas is a small studio in Michigan. We redesign the websites of
            restaurants whose food is far better than their front door — and we do the design
            before we ask you for anything.
          </p>
        </div>
      </section>

      {/* ── 立场陈述（主张卡）─────────────────────────── */}
      <section className="shell py-10 md:py-14">
        <Card size="xl" className="overflow-hidden px-6 py-10 md:px-14 md:py-16">
          <div className="prose-fc">
            <p className="text-[1.08rem] md:text-[1.15rem]">
              <strong>Most of the restaurants we approach are not struggling.</strong> The room is
              busy, the reviews are good, and the kitchen knows exactly what it is doing. The
              website is the one part of the business nobody has had a free Tuesday to fix.
            </p>
            <p>
              That gap is unfair, and it is expensive in a way that never shows up on a P&amp;L. A
              cramped menu PDF, a phone number that will not tap, a photo of a dining room from two
              renovations ago — none of it changes how the food tastes, and all of it changes how
              many people decide to come.
            </p>
            <p>
              So we stopped writing proposals. We pick a restaurant, study it properly, and build a
              complete concept for a new site at our own cost. Then we send it. There is no call to
              schedule and no invoice attached. You have already seen the finished thing before the
              question of money comes up, which means the decision is about the work rather than
              about trusting a stranger.
            </p>
            <p>
              That is the whole idea, and every other thing about how this studio runs follows from
              it.
            </p>
          </div>
        </Card>
      </section>

      {/* ── 我们怎么做事 ─────────────────────────────── */}
      <Section
        eyebrow="How the studio works"
        title="Design first. Conversation second."
        sub="The order of these four steps is the entire difference between us and every other web shop that has emailed you."
      >
        <ol className="grid gap-5 md:grid-cols-2">
          {HOW.map((s) => (
            <Card as="li" key={s.step} hover className="p-7 md:p-9">
              <span
                className="display block text-[1.6rem] text-accent"
                aria-hidden="true"
              >
                {s.step}
              </span>
              <h3 className="display mt-3 text-[1.3rem] text-ink md:text-[1.45rem]">{s.title}</h3>
              <p className="mt-3 text-[0.975rem] leading-relaxed text-ink-2">{s.body}</p>
            </Card>
          ))}
        </ol>
      </Section>

      {/* ── 我们相信什么 ─────────────────────────────── */}
      <Section
        eyebrow="What we believe"
        title="Four opinions we are not flexible about."
      >
        <div className="grid gap-5 md:grid-cols-2">
          {BELIEFS.map((b) => (
            <Card key={b.title} className="p-7 md:p-9">
              <h3 className="display text-[1.3rem] leading-snug text-ink md:text-[1.5rem]">
                {b.title}
              </h3>
              <p className="mt-4 text-[0.975rem] leading-relaxed text-ink-2">{b.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── 我们拒绝做的事 ───────────────────────────── */}
      <Section
        eyebrow="What we refuse to do"
        title="The list that keeps us honest."
        sub="A studio that emails restaurants out of the blue has to be careful about how it behaves. These are the lines we hold."
      >
        <Card size="lg" className="overflow-hidden px-6 py-4 md:px-10 md:py-6">
          <ul>
            {REFUSALS.map((r, i) => (
              <li
                key={r.title}
                className={`py-6 md:py-8 ${i > 0 ? "border-t border-line" : ""}`}
              >
                <div className="flex gap-4 md:gap-5">
                  <span
                    className="mt-1 grid size-7 shrink-0 place-items-center rounded-[var(--r-full)] bg-surface-inset"
                    aria-hidden="true"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 2.5l7 7M9.5 2.5l-7 7"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        className="text-ink-3"
                      />
                    </svg>
                  </span>
                  <div>
                    <h3 className="text-[1.02rem] font-semibold text-ink">{r.title}</h3>
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">{r.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      {/* ── 诚实的现状 + 所在地 ──────────────────────── */}
      <Section eyebrow="Where things stand" title="We are new, and we would rather say so.">
        <div className="grid gap-5 md:grid-cols-[1.15fr_1fr]">
          <Card className="p-7 md:p-10">
            <Badge tone="accent">Early access</Badge>
            <p className="mt-5 text-[0.975rem] leading-relaxed text-ink-2">
              FrontCanvas is at the beginning. There is no wall of client logos on this site
              because there is not yet a wall of client logos, and putting one up would be the
              easiest lie in this industry to tell.
            </p>
            <p className="mt-4 text-[0.975rem] leading-relaxed text-ink-2">
              What that means for you is practical: we are taking a small number of restaurants at
              a time, the person who designs your site is the person who answers your email, and
              nothing gets handed off to an account manager who has never read your menu.
            </p>
            <p className="mt-4 text-[0.975rem] leading-relaxed text-ink-2">
              When there is something real to show, it will appear here. Until then, this space
              stays empty on purpose.
            </p>
          </Card>

          <Card className="p-7 md:p-10">
            <h3 className="display text-[1.35rem] text-ink">Where we are</h3>
            <p className="mt-4 text-[0.975rem] leading-relaxed text-ink-2">
              We started in Michigan because it is where we eat, and because a
              town with this much good food should not have this many bad restaurant websites. We
              work outward across southeast Michigan, and remotely elsewhere.
            </p>

            <dl className="mt-7 space-y-5">
              <div>
                <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.09em] text-ink-3">
                  Studio address
                </dt>
                <dd className="mt-1.5">
                  <address className="text-[0.95rem] not-italic leading-relaxed text-ink">
                    {POSTAL_ADDRESS}
                  </address>
                </dd>
              </div>
              <div>
                <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.09em] text-ink-3">
                  Email
                </dt>
                <dd className="mt-1.5">
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="tap text-[0.95rem] font-medium text-accent hover:text-accent-hover"
                  >
                    {CONTACT_EMAIL}
                  </a>
                  <p className="mt-1 text-[0.85rem] text-ink-3">
                    We reply within one business day.
                  </p>
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </Section>

      {/* ── 收尾 CTA ─────────────────────────────────── */}
      <section className="shell pb-4 pt-6 md:pb-10">
        <Card size="xl" className="px-6 py-12 text-center md:px-14 md:py-16">
          <h2 className="display mx-auto max-w-[22ch] text-[1.9rem] leading-[1.1] text-ink md:text-[2.6rem]">
            If your website is the worst thing about your restaurant, we would like to fix it.
          </h2>
          <p className="mx-auto mt-5 max-w-[42ch] text-[1rem] leading-relaxed text-ink-2">
            Tell us where to eat and we will build you a concept. You will see it before any money
            is discussed.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/contact" size="lg">
              Get a free concept
            </ButtonLink>
            <ButtonLink href="/pricing" variant="outline" size="lg">
              See what it costs
            </ButtonLink>
          </div>
          <p className="mt-6 text-[0.85rem] text-ink-3">
            Nothing is charged until you have seen the design.
          </p>
        </Card>
      </section>
    </>
  );
}

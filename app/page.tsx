import type { Metadata } from "next";
import { ButtonLink } from "@/components/button";
import { BeforeAfter } from "@/components/before-after";
import { Card, Eyebrow, Section } from "@/components/ui";
import { TIERS, formatPrice } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "FrontCanvas — Restaurant websites worth walking into",
  description:
    "We redesign restaurant websites so the first thing a hungry stranger sees does your kitchen justice. See the finished design before you spend a dollar.",
  alternates: { canonical: "/" },
};

/* ────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <div className="shell pt-10 md:pt-20">
      <div className="grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr] md:gap-16">
        <div className="rise">
          <Eyebrow>Restaurant websites, redesigned</Eyebrow>
          <h1 className="display mt-4 text-[2.75rem] leading-[1.02] text-ink sm:text-[3.4rem] md:text-[4.1rem]">
            Your food is better than your website.
          </h1>
          <p className="mt-6 max-w-[38ch] text-[1.08rem] leading-relaxed text-ink-2">
            Most people decide where to eat on a phone, in about the time it takes to read a
            menu board. We rebuild that first impression so it does your kitchen justice.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <ButtonLink href="/pricing" size="lg">
              See what it costs
            </ButtonLink>
            <ButtonLink href="/how-it-works" variant="outline" size="lg">
              How it works
            </ButtonLink>
          </div>
          <p className="mt-6 text-[0.875rem] text-ink-3">
            We design first, invoice later. You will see the finished concept before you decide
            anything.
          </p>
        </div>

        <Card size="lg" className="rise p-5 md:p-7" style={{ animationDelay: "90ms" }}>
          <BeforeAfter />
          <p className="mt-6 border-t border-line pt-5 text-[0.85rem] leading-relaxed text-ink-3">
            Same restaurant. Same food. One of these gets the reservation.
          </p>
        </Card>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */

const COSTS = [
  {
    title: "They are holding a phone",
    body: "Nearly every first visit to your site happens on a small screen, often while someone is already out and deciding. If they have to pinch and zoom to read the menu, they are gone before the appetizer.",
  },
  {
    title: "Slow reads as closed",
    body: "A site that takes several seconds to appear feels abandoned. People do not wait to find out whether you are still open — they tap back and pick the next result.",
  },
  {
    title: "No menu, no visit",
    body: "The menu is the only thing most people came for. When it is a blurry photo, a PDF that will not open on a phone, or three years out of date, you have answered their question with a shrug.",
  },
];

function TheCost() {
  return (
    <Section
      eyebrow="The quiet problem"
      title="A dated website turns people away without ever telling you"
      sub="No one emails to say they picked somewhere else because your site looked closed. It just shows up as a slower Tuesday."
    >
      <ul className="grid gap-5 md:grid-cols-3">
        {COSTS.map((c) => (
          <Card as="li" key={c.title} hover className="p-7">
            <h3 className="display text-[1.35rem] leading-snug text-ink">{c.title}</h3>
            <p className="mt-3.5 text-[0.95rem] leading-relaxed text-ink-2">{c.body}</p>
          </Card>
        ))}
      </ul>
    </Section>
  );
}

/* ────────────────────────────────────────────────────────── */

const ANATOMY = [
  { k: "Menu", d: "Readable on a phone without zooming. Updated when your menu changes, not when someone gets around to it." },
  { k: "Photos", d: "Your room and your plates, given the space they deserve — not squeezed into a sidebar." },
  { k: "Hours & location", d: "Above the fold, tappable, wired to Maps and to your phone line." },
  { k: "Ordering", d: "Connected to whatever you already use, so you are not paying a middleman for a regular." },
  { k: "Reservations", d: "Booking that takes three taps, including on the phone in someone's coat pocket." },
  { k: "Found on Google", d: "The technical groundwork that decides whether you show up when someone searches your neighbourhood." },
];

function Anatomy() {
  return (
    <Section
      eyebrow="What we actually build"
      title="Six things a restaurant site has to get right"
      sub="Everything else is decoration. We start here, then make it beautiful."
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ANATOMY.map((a, i) => (
          <Card as="li" key={a.k} size="sm" hover className="flex gap-4 p-6">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-[var(--r-xs)] bg-accent-soft text-[0.72rem] font-bold text-accent">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="text-[1rem] font-semibold text-ink">{a.k}</h3>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-2">{a.d}</p>
            </div>
          </Card>
        ))}
      </ul>
    </Section>
  );
}

/* ────────────────────────────────────────────────────────── */

const STEPS = [
  { n: "01", t: "We find you", d: "We go looking for restaurants with good reviews and a website that is holding them back." },
  { n: "02", t: "We design it", d: "A complete concept for your restaurant specifically. No questionnaire, no meeting, no cost." },
  { n: "03", t: "You take a look", d: "One email with the design in it and a link. If it is not for you, one click and we stop." },
  { n: "04", t: "We build it", d: "You say go, and it is live on your own domain in about two weeks." },
];

function Process() {
  return (
    <Section
      eyebrow="How this works"
      title="You see the finished thing before you spend anything"
      sub="Talking a restaurant into a new website is hard. Showing one is easy. So we build first."
    >
      <ol className="grid gap-4 md:grid-cols-4">
        {STEPS.map((s) => (
          <Card as="li" key={s.n} className="p-6">
            <span className="display text-[2rem] text-accent">{s.n}</span>
            <h3 className="mt-2 text-[1.05rem] font-semibold text-ink">{s.t}</h3>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-2">{s.d}</p>
          </Card>
        ))}
      </ol>
      <div className="mt-8">
        <ButtonLink href="/how-it-works" variant="outline">
          The longer version
        </ButtonLink>
      </div>
    </Section>
  );
}

/* ────────────────────────────────────────────────────────── */

function PricingPeek() {
  return (
    <Section
      eyebrow="Pricing"
      title="One price, written down, before we start"
      sub="No hourly billing, no discovery phase, no surprise line items."
      align="center"
    >
      <ul className="mx-auto grid max-w-[62rem] gap-5 md:grid-cols-3">
        {TIERS.map((t) => (
          <Card
            as="li"
            key={t.id}
            size={t.featured ? "lg" : "md"}
            hover
            className={`p-7 ${t.featured ? "ring-1 ring-accent-line md:-my-3 md:py-10" : ""}`}
          >
            <h3 className="text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-accent">
              {t.name}
            </h3>
            <p className="display mt-3 text-[2.4rem] leading-none text-ink">
              {formatPrice(t.amountCents)}
              {t.interval && <span className="text-[0.95rem] text-ink-3"> /mo</span>}
            </p>
            <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-2">{t.tagline}</p>
          </Card>
        ))}
      </ul>
      <div className="mt-10 flex justify-center">
        <ButtonLink href="/pricing" size="lg">
          What is included
        </ButtonLink>
      </div>
    </Section>
  );
}

/* ────────────────────────────────────────────────────────── */

function FinalCta() {
  return (
    <div className="shell py-8 md:py-16">
      <Card size="xl" className="overflow-hidden px-7 py-14 text-center md:px-16 md:py-20">
        <h2 className="display mx-auto max-w-[18ch] text-[2.1rem] leading-[1.08] text-ink md:text-[3rem]">
          We might already be working on yours.
        </h2>
        <p className="mx-auto mt-5 max-w-[46ch] text-[1.02rem] leading-relaxed text-ink-2">
          Every night we go through restaurants across Michigan and the states around it, looking
          for kitchens that deserve a better front door. If that sounds like yours, you can also
          just ask.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/contact" size="lg">
            Ask for a concept
          </ButtonLink>
          <ButtonLink href="/pricing" variant="ghost" size="lg">
            See pricing
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <>
      <Hero />
      <TheCost />
      <Anatomy />
      <Process />
      <PricingPeek />
      <FinalCta />
    </>
  );
}

import type { Metadata } from "next";
import { Badge, Card, Eyebrow, Section } from "@/components/ui";
import { ButtonLink } from "@/components/button";
import { TIER_BY_ID, depositCents, formatPrice } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "We design a new website for your restaurant first, for free, then send it to you. Here are the four steps, why it costs you nothing to look, and how a project goes live in about two weeks.",
  alternates: { canonical: "/how-it-works" },
};

const STEPS: {
  n: string;
  title: string;
  body: string[];
  note: string;
}[] = [
  {
    n: "01",
    title: "We find you",
    body: [
      "We start with the food. We read the reviews, the local write-ups, the photos people keep posting of one particular dish. When a place clearly has a kitchen that knows what it is doing, we go look at its website.",
      "If the website is a scanned menu, a page that pinches sideways on a phone, or something built years ago by a cousin who has since moved away, that restaurant goes on our list.",
    ],
    note: "Nobody buys a place on that list, and nobody can pay to skip it.",
  },
  {
    n: "02",
    title: "We design it first",
    body: [
      "Then we build the new site. Not a template with your logo dropped into it — a real concept using your menu, your dishes, your hours, your corner of town. It takes us a few days.",
      "You are not involved in this part. No form to fill out, no call to schedule, no files to send. At this stage you do not even know we are working.",
    ],
    note: "It costs you nothing because you have not agreed to anything yet.",
  },
  {
    n: "03",
    title: "You get one email",
    body: [
      "One email, written by a person, with a link in it. Open the link and the finished website is right there on your phone. Scroll it in the walk-in. Show it to your partner. Or close it and never think about it again.",
      "There is an unsubscribe link at the bottom and it works on the first click — no form, no survey, no are-you-sure. If you use it, you never hear from us again.",
    ],
    note: "If you say nothing, we do not send a second email.",
  },
  {
    n: "04",
    title: "You say go, we build it",
    body: [
      "If you want it, reply. We sort out the details, you put down half, and we turn the concept into the real thing on your own domain — every page, every phone size, directions and click-to-call wired up.",
      "About two weeks from the day you say go. If you would rather not, say nothing. The concept comes down and that is the end of it.",
    ],
    note: "Half up front, the rest the day it goes live.",
  },
];

const TIMELINE: { when: string; title: string; body: string }[] = [
  {
    when: "Day 0",
    title: "You reply",
    body: "Twenty minutes on the phone, or just a few emails if you prefer. We ask for the current menu, your real hours, and any photos you actually like.",
  },
  {
    when: "Day 1 – 3",
    title: "We fix the concept",
    body: "Everything you disliked in the draft comes out. Real prices go in. You approve the direction before anyone writes a line of code.",
  },
  {
    when: "Day 4 – 9",
    title: "We build it for real",
    body: "Every page, tested on the phones your customers actually carry. Maps, directions, tap-to-call, and the search basics so Google reads it properly.",
  },
  {
    when: "Day 10 – 12",
    title: "You walk through it",
    body: "You get a private link and mark up anything that is off. Revisions are included — see the plan you picked for how many rounds.",
  },
  {
    when: "Day 13 – 14",
    title: "It goes live",
    body: "We point your domain at it and hand it over. After that, one phone number to text when the menu changes.",
  },
];

export default function HowItWorksPage() {
  const launch = TIER_BY_ID.launch;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="shell pt-10 pb-2 md:pt-16 md:pb-6">
        <div className="max-w-[54rem]">
          <Eyebrow>How it works</Eyebrow>
          <h1 className="display mt-4 text-[2.35rem] leading-[1.05] text-ink md:text-[3.9rem]">
            You see the finished website before you pay for it.
          </h1>
          <p className="mt-6 max-w-[40rem] text-[1.05rem] leading-relaxed text-ink-2 md:text-[1.15rem]">
            Most studios sell you a promise and take a deposit. We do it the other
            way around. We pick a restaurant we think deserves better, design the
            whole thing, and send it over. You decide once it is in front of you.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-2.5">
            <Badge tone="accent">The concept is free</Badge>
            <Badge>No call to book</Badge>
            <Badge>Live in about two weeks</Badge>
          </div>
        </div>
      </section>

      {/* ── The four steps ───────────────────────────────── */}
      <Section
        eyebrow="The four steps"
        title="Four steps, and three of them are ours."
        sub="You do exactly one thing in this process, and only if you want to."
      >
        <ol className="grid gap-5 md:grid-cols-2 md:gap-x-7 md:gap-y-8 md:mb-10">
          {STEPS.map((step, i) => (
            <Card
              as="li"
              key={step.n}
              size="lg"
              className={`flex flex-col p-7 md:p-9 ${i % 2 === 1 ? "md:translate-y-10" : ""}`}
            >
              <div className="flex items-center gap-3.5">
                <span
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-[var(--r-full)] bg-accent-soft font-mono text-[0.82rem] font-semibold text-accent"
                >
                  {step.n}
                </span>
                <h3 className="display text-[1.4rem] leading-tight text-ink md:text-[1.6rem]">
                  <span className="sr-only">{`Step ${i + 1}. `}</span>
                  {step.title}
                </h3>
              </div>

              <div className="mt-5 space-y-3.5 text-[0.97rem] leading-relaxed text-ink-2">
                {step.body.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>

              <p className="mt-auto pt-6 text-[0.875rem] leading-relaxed text-ink-3">
                {step.note}
              </p>
            </Card>
          ))}
        </ol>
      </Section>

      {/* ── The two obvious questions ────────────────────── */}
      <Section
        eyebrow="The obvious questions"
        title="Why free, and where does the concept live?"
        sub="Both answers are the same kind of answer: it is easier for us this way, and lower risk for you."
      >
        <div className="grid gap-5 md:grid-cols-2 md:gap-7">
          <Card size="lg" className="p-7 md:p-9">
            <h3 className="display text-[1.3rem] leading-snug text-ink md:text-[1.5rem]">
              Why would you do all that work for free?
            </h3>
            <div className="mt-5 space-y-3.5 text-[0.97rem] leading-relaxed text-ink-2">
              <p>
                Because arguing a restaurant into a new website is nearly
                impossible, and showing one is easy.
              </p>
              <p>
                We could send you a pitch about phone traffic and bounce rates. You
                would delete it, and you would be right to — every web company in
                the country sends that email. So we skip the argument and do the
                work instead.
              </p>
              <p>
                You look at a real site, built for your real restaurant, before a
                dollar moves. If it is not plainly better than what you have now,
                you will know in about four seconds, and you owe us nothing. That
                is the whole trade: we spend a few days on spec, and you get to
                judge finished work instead of promises.
              </p>
            </div>
            <div className="mt-7 rounded-[var(--r-md)] bg-surface-inset px-5 py-4 text-[0.9rem] leading-relaxed text-ink-2">
              We are a small studio in Michigan, and we take a
              handful of restaurants at a time. That is the limit on this — not a
              sales tactic, just how many kitchens two hands can cook for.
            </div>
          </Card>

          <Card size="lg" className="p-7 md:p-9">
            <h3 className="display text-[1.3rem] leading-snug text-ink md:text-[1.5rem]">
              Where does the concept live until I decide?
            </h3>
            <div className="mt-5 space-y-3.5 text-[0.97rem] leading-relaxed text-ink-2">
              <p>
                On a page that only you have the address to. It is built with your
                real name and your real dishes on it — a concept with the name
                stripped out looks like a stock template, and you would have no way
                to tell whether it was actually made for your restaurant.
              </p>
              <p>
                What keeps it private is not a blanked-out sign. It is the address:
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1.5 rounded-[var(--r-md)] bg-surface-inset px-5 py-4">
              <span className="font-mono text-[1.05rem] font-medium tracking-tight text-ink">
                frontcanvas.com/p/k7m2p9qx
              </span>
              <span className="text-[0.85rem] text-ink-3">
                random, unguessable, yours alone
              </span>
            </div>

            <div className="mt-5 space-y-3.5 text-[0.97rem] leading-relaxed text-ink-2">
              <p>
                Nothing in that address hints at your restaurant. The page is never
                linked from anywhere on this site, it tells search engines to skip
                it, and nobody finds it by searching your name. The only way in is
                the link we emailed you.
              </p>
              <p>
                It comes down the moment you ask. And the day you say go, the whole
                thing moves to your own domain — not ours.
              </p>
            </div>
          </Card>
        </div>
      </Section>

      {/* ── Timeline ─────────────────────────────────────── */}
      <Section
        eyebrow="Timeline"
        title="From your reply to live: about two weeks."
        sub="Nothing here needs you to learn software, sit in a kickoff meeting, or write copy."
      >
        <Card size="lg" className="p-7 md:p-11">
          <ol>
            {TIMELINE.map((item, i) => {
              const last = i === TIMELINE.length - 1;
              return (
                <li key={item.when} className="flex gap-5 md:gap-7">
                  <div className="flex flex-col items-center" aria-hidden="true">
                    <span className="mt-2 size-2.5 shrink-0 rounded-[var(--r-full)] bg-accent" />
                    {!last && <span className="mt-2 w-px flex-1 bg-line-2" />}
                  </div>
                  <div className={last ? "" : "pb-9"}>
                    <p className="font-mono text-[0.72rem] font-medium uppercase tracking-[0.1em] text-ink-3">
                      {item.when}
                    </p>
                    <h3 className="mt-2 text-[1.05rem] font-semibold text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-[46ch] text-[0.95rem] leading-relaxed text-ink-2">
                      {item.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <p className="mt-9 border-t border-line pt-6 text-[0.9rem] leading-relaxed text-ink-3">
            Two weeks is the normal case. A menu with four hundred items or a
            domain locked in an account nobody can log into will add a few days,
            and we will tell you that before you pay anything.
          </p>
        </Card>
      </Section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="shell pb-20 md:pb-28">
        <Card size="xl" className="px-7 py-12 text-center md:px-14 md:py-16">
          <Eyebrow>What happens after yes</Eyebrow>
          <h2 className="display mx-auto mt-4 max-w-[24ch] text-[2rem] leading-[1.08] text-ink md:text-[2.85rem]">
            The price is on one page, with nothing underneath it.
          </h2>
          <p className="mx-auto mt-5 max-w-[42ch] text-[1.02rem] leading-relaxed text-ink-2">
            {launch.name} is {formatPrice(launch.amountCents)} for the whole site,
            built and live. You put down {formatPrice(depositCents(launch))} to
            start and pay the rest the day it goes up.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/pricing" size="lg">
              See what it costs
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline" size="lg">
              Ask us something first
            </ButtonLink>
          </div>

          <p className="mx-auto mt-8 max-w-[46ch] text-[0.9rem] leading-relaxed text-ink-3">
            Have not heard from us and think your website is holding the kitchen
            back? Tell us where you are. We will look at the place and, if we can
            help, you will get the same email everyone else gets.
          </p>
        </Card>
      </section>
    </>
  );
}

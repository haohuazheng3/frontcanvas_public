import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, Eyebrow } from "@/components/ui";
import { ButtonLink } from "@/components/button";
import { CONTACT_EMAIL } from "@/components/site-footer";
import { TIERS, depositCents, formatPrice, type Tier } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Refunds and cancellation",
  description:
    "Deposits are refunded in full before work starts and pro-rated once it has. Care cancels any time with no fee. How to ask for a refund, and how long it takes to land.",
  alternates: { canonical: "/refunds" },
};

const UPDATED = "August 14, 2026";

const ONE_TIME: Tier[] = TIERS.filter((t) => t.interval === null);
const CARE = TIERS.find((t) => t.interval === "month");

const STAGES = [
  {
    when: "Before the kickoff date",
    back: "Full deposit back",
    tone: "ok",
    detail:
      "We name the kickoff date in writing before we take a cent. Any time before that day arrives, ask and the entire deposit is returned. We have not opened the file yet, so there is nothing to charge for.",
  },
  {
    when: "Kickoff done, first full draft not yet delivered",
    back: "Half the deposit back",
    tone: "warn",
    detail:
      "Research, structure, and the first design passes are underway. Half the deposit covers the hours already spent; the other half comes back to you.",
  },
  {
    when: "First full draft delivered",
    back: "Deposit is earned",
    tone: "neutral",
    detail:
      "You have the whole design in front of you, which is the bulk of the work. The deposit is not refundable at this point — but you owe nothing further. You can walk away with no balance due and no invoice chasing you.",
  },
  {
    when: "Site is live",
    back: "No refund",
    tone: "neutral",
    detail:
      "The service has been delivered and the site is doing its job. The thirty-day fix-it window still applies: anything broken in our work gets fixed at no charge.",
  },
] as const;

const ALWAYS_REFUNDED = [
  "A duplicate charge, or the same invoice paid twice.",
  "Any charge taken after you cancelled.",
  "Money taken for a project we then could not take on.",
  "A subscription charge that landed after your cancellation date.",
];

export default function RefundsPage() {
  return (
    <div className="shell py-14 md:py-24">
      <div className="mx-auto max-w-[54rem]">
        <header className="max-w-[44rem]">
          <Eyebrow>Legal</Eyebrow>
          <h1 className="display mt-3 text-[2.4rem] text-ink md:text-[3.4rem]">
            Refunds and cancellation
          </h1>
          <p className="mt-5 text-[1.05rem] leading-relaxed text-ink-2">
            The principle is simple: you pay for work that has been done, and you do not pay for work
            that has not. Everything below is that idea, spelled out so nobody has to guess.
          </p>
          <p className="mt-6 text-[0.85rem] text-ink-3">Last updated {UPDATED}</p>
        </header>

        <Card size="lg" className="mt-10 p-6 md:p-10">
          <h2 className="display text-[1.5rem] text-ink md:text-[1.75rem]">The short version</h2>
          <ul className="mt-5 space-y-3.5">
            {[
              "The concept we email you is free. There is nothing to refund because there was nothing to pay.",
              "The deposit comes back in full any time before we start work.",
              "Once we have started, you get back the part we have not earned.",
              CARE
                ? `${CARE.name} cancels any time, takes effect at the end of the month you already paid for, and carries no cancellation fee.`
                : "Subscriptions cancel any time, with no cancellation fee.",
              "One email is the whole process. No form, no phone call, no retention script.",
            ].map((line) => (
              <li key={line} className="flex gap-3.5">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-[var(--r-full)] bg-accent"
                />
                <span className="text-[0.975rem] leading-relaxed text-ink-2">{line}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* 阶段化退款 —— 这页的核心 */}
        <Card size="lg" className="mt-6 px-6 py-10 md:px-12 md:py-14">
          <h2 id="stages" className="display scroll-mt-24 text-[1.6rem] leading-[1.22] text-ink md:text-[1.9rem]">
            Cancelling a project, stage by stage
          </h2>
          <p className="mt-4 max-w-[68ch] text-[1rem] leading-[1.72] text-ink-2">
            One-time projects start with a deposit and finish with the balance. What happens to that
            deposit depends only on how far along we are — not on how you word the request.
          </p>

          <ol className="mt-8 grid gap-3.5">
            {STAGES.map((s, i) => (
              <li key={s.when} className="rounded-[var(--r-md)] bg-surface-inset p-5 md:p-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span
                    aria-hidden="true"
                    className="grid size-7 shrink-0 place-items-center rounded-[var(--r-full)] bg-surface text-[0.8rem] font-semibold text-ink-3"
                  >
                    {i + 1}
                  </span>
                  <span className="text-[1.02rem] font-semibold text-ink">{s.when}</span>
                  <Badge tone={s.tone}>{s.back}</Badge>
                </div>
                <p className="mt-3 text-[0.94rem] leading-relaxed text-ink-2">{s.detail}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8 max-w-[68ch] space-y-4 text-[1rem] leading-[1.72] text-ink-2">
            <p>
              For reference, here is what a deposit actually is on each project, so you know the
              number we are talking about:
            </p>
            <ul className="space-y-2">
              {ONE_TIME.map((t) => (
                <li key={t.id} className="flex flex-wrap items-baseline gap-x-2.5">
                  <span className="font-semibold text-ink">{t.name}</span>
                  <span>
                    {formatPrice(depositCents(t))} deposit of {formatPrice(t.amountCents)} total
                  </span>
                </li>
              ))}
            </ul>
            <p>
              If you paid a balance in advance and then cancelled, the balance comes back in full
              regardless of stage. We only ever keep money against work that exists.
            </p>
          </div>
        </Card>

        {/* Care 订阅 */}
        {CARE && (
          <Card size="lg" className="mt-6 px-6 py-10 md:px-12 md:py-14">
            <h2 id="care" className="display scroll-mt-24 text-[1.6rem] leading-[1.22] text-ink md:text-[1.9rem]">
              Cancelling {CARE.name}
            </h2>
            <div className="prose-fc mt-4">
              <p>
                {CARE.name} is {formatPrice(CARE.amountCents)} a month and you can cancel it at any
                time, from your account or by sending us one line of email. There is no notice
                period, no cancellation fee, and nobody will call to talk you out of it.
              </p>
              <p>
                Cancellation takes effect at the end of the month you have already paid for. You keep
                the service until that date, and we do not refund a part-used month — but we also
                never charge you again after it. If a charge does slip through after you cancelled, it
                comes straight back in full.
              </p>
              <p>
                When it ends, we hand over your site files and move the domain into an account you
                own. Your website is yours. Cancelling {CARE.name} means we stop doing the edits, not
                that your site disappears.
              </p>
            </div>
          </Card>
        )}

        {/* 总是全额退 / 不退的部分 */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card size="lg" className="p-6 md:p-9">
            <Badge tone="ok">Always refunded in full</Badge>
            <ul className="mt-5 space-y-3">
              {ALWAYS_REFUNDED.map((line) => (
                <li key={line} className="flex gap-3">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-[var(--r-full)] bg-ok" />
                  <span className="text-[0.94rem] leading-relaxed text-ink-2">{line}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[0.9rem] leading-relaxed text-ink-3">
              These do not need a reason or a conversation. Point at the charge and it is reversed.
            </p>
          </Card>

          <Card size="lg" className="p-6 md:p-9">
            <Badge tone="neutral">Not refundable</Badge>
            <p className="mt-5 text-[0.94rem] leading-relaxed text-ink-2">
              Money we paid to somebody else on your behalf: domain registration, stock photography,
              paid plugins, licences, ordering-platform setup fees. Once those are bought they are
              bought, and the money is no longer ours to return.
            </p>
            <p className="mt-3.5 text-[0.94rem] leading-relaxed text-ink-2">
              We will always tell you before spending anything on your behalf, we will always show
              you the receipt, and the domain stays registered in your name either way.
            </p>
          </Card>
        </div>

        {/* 如何申请 */}
        <Card size="lg" className="mt-6 px-6 py-10 md:px-12 md:py-14">
          <div className="prose-fc [&>h2:first-child]:mt-0 [&>h2]:scroll-mt-24">
            <h2 id="how">How to ask for a refund</h2>
            <p>
              Send one email to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the
              address on the invoice. Tell us the restaurant name and, roughly, what happened. You do
              not have to justify yourself and you will not be routed through anybody.
            </p>
            <p>Then this is what happens, and when:</p>
            <ul>
              <li>
                <strong>Within one business day</strong> — a human replies to confirm we have it.
              </li>
              <li>
                <strong>Within three business days</strong> — we approve it, or we explain in writing
                why not and show you exactly what was built.
              </li>
              <li>
                <strong>Same day as approval</strong> — the refund is issued through Stripe to the
                original card. We do not sit on it.
              </li>
              <li>
                <strong>Five to ten business days</strong> — your bank posts it. That last stretch is
                out of our hands, and it is the same for every business taking cards.
              </li>
            </ul>

            <h2 id="disagree">If we say no</h2>
            <p>
              You get the reason in writing, along with the work that was done, so you can judge it
              for yourself rather than take our word for it. If you still think we have it wrong, say
              so — we would rather return money we could have argued over than have a restaurant in
              town telling people we kept it.
            </p>

            <h2 id="chargebacks">Before you call your bank</h2>
            <p>
              Please email us first. A chargeback freezes the money for weeks, hands the decision to
              two banks who know nothing about your project, and leaves us unable to fix whatever went
              wrong in the meantime. We have never refused a fair refund. Ask us directly and it is
              usually settled the same week.
            </p>

            <h2 id="terms">How this fits with everything else</h2>
            <p>
              This page forms part of our <Link href="/terms">terms of service</Link>, and where the
              two speak to the same thing, this page governs money. Prices and what is included are
              on the <Link href="/pricing">pricing page</Link>.
            </p>
          </div>
        </Card>

        <Card size="lg" className="mt-6 p-6 text-center md:p-10">
          <h2 className="display text-[1.4rem] text-ink md:text-[1.6rem]">Need a refund?</h2>
          <p className="mx-auto mt-3 max-w-[44ch] text-[0.975rem] leading-relaxed text-ink-2">
            One email is the entire process. We reply within one business day.
          </p>
          <div className="mt-7">
            <ButtonLink href={`mailto:${CONTACT_EMAIL}?subject=Refund%20request`} size="md">
              Email {CONTACT_EMAIL}
            </ButtonLink>
          </div>
        </Card>
      </div>
    </div>
  );
}

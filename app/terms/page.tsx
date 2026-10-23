import type { Metadata } from "next";
import Link from "next/link";
import { Card, Eyebrow } from "@/components/ui";
import { ButtonLink } from "@/components/button";
import { CONTACT_EMAIL, POSTAL_ADDRESS } from "@/components/site-footer";
import { DEPOSIT_RATIO, TIERS, depositCents, formatPrice, type Tier } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The terms FrontCanvas works under: what the free concept is, who owns it before and after payment, deposits and revision rounds, cancellation, and how disagreements are settled under Michigan law.",
  alternates: { canonical: "/terms" },
};

const UPDATED = "August 14, 2026";

const ONE_TIME: Tier[] = TIERS.filter((t) => t.interval === null);
const CARE = TIERS.find((t) => t.interval === "month");
const DEPOSIT_PCT = Math.round(DEPOSIT_RATIO * 100);

function revisionLine(tier: Tier): string | null {
  const line = tier.includes.find((i) => /revision/i.test(i));
  return line ? line.charAt(0).toLowerCase() + line.slice(1) : null;
}

export default function TermsPage() {
  return (
    <div className="shell py-14 md:py-24">
      <div className="mx-auto max-w-[54rem]">
        <header className="max-w-[44rem]">
          <Eyebrow>Legal</Eyebrow>
          <h1 className="display mt-3 text-[2.4rem] text-ink md:text-[3.4rem]">Terms of service</h1>
          <p className="mt-5 text-[1.05rem] leading-relaxed text-ink-2">
            The rules we work under. Written to be read once and understood, not to be survived with
            a lawyer beside you.
          </p>
          <p className="mt-6 text-[0.85rem] text-ink-3">Last updated {UPDATED}</p>
        </header>

        <Card size="lg" className="mt-10 p-6 md:p-10">
          <h2 className="display text-[1.5rem] text-ink md:text-[1.75rem]">The short version</h2>
          <ul className="mt-5 space-y-3.5">
            {[
              "The concept we send you is free and puts you under no obligation whatsoever.",
              "Until the invoice is paid in full, the concept belongs to us. The moment it is paid, the finished work belongs to you.",
              `Projects start with a ${DEPOSIT_PCT}% deposit and the balance is due when the site goes live.`,
              "We do not promise you more customers. Nobody honest can. We promise a website that does not embarrass the food.",
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

        <Card size="lg" className="mt-6 px-6 py-10 md:px-12 md:py-14">
          <div className="prose-fc [&>h2:first-child]:mt-0 [&>h2]:scroll-mt-24">
            <h2 id="parties">1. Who this agreement is between</h2>
            <p>
              These terms are between FrontCanvas, a design studio operating from {POSTAL_ADDRESS},
              and you — whether you are simply reading this site, or you have hired us to build
              something. Using the site means you accept these terms. Paying an invoice means you
              accept them for the work as well.
            </p>

            <h2 id="scope">2. What we do</h2>
            <p>
              We redesign websites for restaurants. Our process runs backwards compared to most
              studios: we find a restaurant whose food deserves better than its website, we design a
              full concept at our own expense, and then we send it. Nothing is charged, and nothing
              is expected, until you have already seen what we would build.
            </p>
            <p>If you want it built for real, we offer three things:</p>
            <ul>
              {ONE_TIME.map((t) => (
                <li key={t.id}>
                  <strong>{t.name}</strong> — {t.tagline.toLowerCase()}. {formatPrice(t.amountCents)},
                  one-time.
                </li>
              ))}
              {CARE && (
                <li>
                  <strong>{CARE.name}</strong> — {CARE.tagline.toLowerCase()}.{" "}
                  {formatPrice(CARE.amountCents)} per month, ongoing, cancel any time.
                </li>
              )}
            </ul>
            <p>
              What each one includes is listed on the <Link href="/pricing">pricing page</Link>, and
              that list is part of this agreement. If we quote you something different, the written
              quote wins.
            </p>

            <h2 id="concept">3. The free concept</h2>
            <p>
              The concept costs nothing and obliges you to nothing. It is a design concept, not a
              finished website — it demonstrates what your site could look like, and some parts of it
              are illustrative rather than functional.
            </p>
            <p>
              We build it from information your restaurant already publishes: your menu, your
              photographs, your hours, your listings. We use that material for the single purpose of
              showing you a proposal. Your name, logo, and photographs remain entirely yours, and
              making a concept gives us no rights over them. The concept is published only at a random, unlisted
              address sent to you, excluded from search engines, and removed on request.
            </p>
            <p>
              If you would rather we did not hold the concept at all, tell us and we delete it. No
              argument, no retention email.
            </p>

            <h2 id="ownership">4. Who owns the work</h2>
            <p>This is the part most studios make deliberately murky, so read it closely.</p>

            <h3>Before payment, the concept is ours</h3>
            <p>
              Until an invoice is paid in full, everything we made — the layout, the design files,
              the code, the photography treatment, the words we wrote — remains our property. You are
              welcome to look at it, sleep on it, and show it to your business partner or your family.
              You may not publish it, sell it, or hand it to another developer to build from. If that
              happens, the work is no longer free and we will invoice for it.
            </p>

            <h3>After payment, the finished work is yours</h3>
            <p>
              When the final invoice is settled, ownership of the deliverables for your project —
              the design files, the page code written for you, the images we produced for you, and
              the copy we wrote for you — transfers to you outright, worldwide and permanently. We
              will confirm that in writing if you ask, and we will hand over the files without
              charging a release fee.
            </p>

            <h3>What stays ours either way</h3>
            <p>
              The general toolkit we carry from job to job — our component library, our internal
              frameworks, our working methods — remains ours. You receive a permanent, unrestricted
              licence to keep using it as part of your website, forever, including if you later move
              to another developer.
            </p>

            <h3>Parts made by other people</h3>
            <p>
              Fonts, stock photography, and third-party plugins arrive with their own licences, which
              we pass on to you. We will always tell you which parts those are and what they cost
              before we use them.
            </p>

            <h3>Showing the work</h3>
            <p>
              We would like to show your finished site in our portfolio and in outreach to other
              restaurants. If you would rather we did not, say so at any point and we will take it
              down. There is no clause here forcing you to be a case study.
            </p>

            <h2 id="payment">5. Prices, deposits, and payment</h2>
            <p>
              Prices are as listed on the <Link href="/pricing">pricing page</Link> on the day you
              accept a quote. For one-time projects, {DEPOSIT_PCT}% is due as a deposit before work
              begins, and the balance is due when the site goes live:
            </p>
            <ul>
              {ONE_TIME.map((t) => (
                <li key={t.id}>
                  <strong>{t.name}</strong> — {formatPrice(t.amountCents)} total.{" "}
                  {formatPrice(depositCents(t))} to start, {formatPrice(t.amountCents - depositCents(t))}{" "}
                  on launch.
                </li>
              ))}
            </ul>
            {CARE && (
              <p>
                {CARE.name} is {formatPrice(CARE.amountCents)} per month, charged on the same date
                each month until you cancel. It is a subscription, and it says so on the invoice.
              </p>
            )}
            <p>
              Payment is taken through Stripe. We never see or store your card number. Sales tax is
              added where the law requires it. If a balance is unpaid, the finished site stays on our
              staging server rather than going live — we will not take a site down that is already
              running, and we will not hold your domain hostage.
            </p>
            <p>
              Refunds, cancellations, and what happens if you change your mind halfway are covered in
              full on the <Link href="/refunds">refunds and cancellation page</Link>, which forms part
              of these terms.
            </p>

            <h2 id="revisions">6. Revisions, and what counts as finished</h2>
            <p>Each project includes a set number of revision rounds:</p>
            <ul>
              {ONE_TIME.map((t) => {
                const line = revisionLine(t);
                return line ? (
                  <li key={t.id}>
                    <strong>{t.name}</strong> — {line}.
                  </li>
                ) : null;
              })}
            </ul>
            <p>
              A round means one consolidated list of changes, sent in one go. Sending three separate
              emails over three days about the same page is still one round — we are not counting
              against you. What uses a round is a fresh pass over the design after you have seen the
              previous one.
            </p>
            <p>
              Work beyond the included rounds, or a change of direction after a design is approved,
              is quoted in writing before we touch it. You will never receive a surprise invoice.
            </p>
            <p>
              If we deliver a round and hear nothing for ten business days, we treat it as approved
              and move to the next stage. Otherwise projects drift forever, and drifting projects are
              how restaurants end up with the bad website they already had.
            </p>

            <h2 id="you">7. What we need from you</h2>
            <ul>
              <li>
                Your content — menu, hours, photographs, logo — and confirmation that you own it or
                have permission to use it. If you send us a photograph you do not have rights to, and
                a photographer comes calling, that one is on you.
              </li>
              <li>One person who can make decisions. Design by committee doubles every timeline.</li>
              <li>Feedback within ten business days of each delivery.</li>
              <li>Access to your domain registrar and any ordering or booking system, when we get to that stage.</li>
            </ul>
            <p>
              If we cannot reach you for thirty days, the project is paused. After sixty days it is
              closed, and the refunds page governs what happens to money already paid. You can restart
              a closed project at any time, and we will not charge you again for work already done.
            </p>

            <h2 id="us">8. What you can count on from us</h2>
            <ul>
              <li>You see the design before you pay anything. That is the whole point of this studio.</li>
              <li>We test on real phones, not just a browser window shrunk down.</li>
              <li>We tell you before anything costs extra, in writing, every time.</li>
              <li>We reply within one business day.</li>
              <li>We hand over what you paid for, on request, in a format you can take elsewhere.</li>
            </ul>

            <h2 id="third-party">9. Things we set up but do not control</h2>
            <p>
              A working restaurant website leans on other companies: your domain registrar, hosting,
              an online ordering platform, a reservation system, Google. We set these up for you and
              we know how they behave, but we do not own them. Their terms, their fees, and their
              outages are theirs. Where an ongoing fee is paid to them rather than to us — domain
              renewal after the first year, ordering platform commissions — we will tell you the
              amount before you commit.
            </p>

            {CARE && (
              <>
                <h2 id="care">10. The {CARE.name} subscription</h2>
                <p>
                  {CARE.name} covers unlimited content edits: menus, prices, hours, photographs,
                  seasonal specials, holiday notices. Send us the change and it is done that week.
                </p>
                <p>
                  What it does not cover is new work dressed up as an edit — a new page type, a new
                  booking system, a full redesign. Those get quoted separately, and we will say so
                  plainly rather than quietly slowing down your requests. Cancel any time; the
                  refunds page explains exactly what happens to the month in progress.
                </p>
              </>
            )}

            <h2 id="termination">11. Ending things</h2>
            <p>
              You can stop at any point, for any reason, without explaining yourself. Money already
              paid is handled by the refunds page.
            </p>
            <p>
              We may decline a project or stop work if an invoice goes unpaid, if we are asked to
              publish something unlawful or deceptive, or if someone is abusive to us. If we stop
              work for our own reasons, we refund everything we have not yet earned, and we say why.
            </p>
            <p>
              Whenever things end, you keep whatever you have paid for in full, and we keep the work
              that was never paid for.
            </p>

            <h2 id="warranty">12. What we promise, and what we do not</h2>
            <p>
              For thirty days after your site goes live, we fix defects in our own work at no charge —
              broken links, layout faults, anything that does not behave the way we said it would.
            </p>
            <p>
              We do not promise business outcomes. Not a number of new customers, not a position in
              Google results, not a revenue figure. A better website helps, sometimes a great deal,
              but anyone selling you a guaranteed ranking is either guessing or lying. Beyond what is
              explicitly written in these terms, the service is provided as it is.
            </p>

            <h2 id="liability">13. Limits on liability</h2>
            <p>
              If something goes wrong and it is our fault, our total liability is limited to the
              amount you paid us in the twelve months before the problem arose. We are not liable for
              indirect losses — lost profit, lost bookings, lost data held by someone else — to the
              extent the law allows us to say so.
            </p>
            <p>
              Nothing here limits liability for fraud, for deliberate wrongdoing, or for anything that
              cannot lawfully be limited. We are not trying to sneak past those.
            </p>

            <h2 id="law">14. Michigan law, and how disagreements get settled</h2>
            <p>
              These terms are governed by the laws of the State of Michigan, without regard to its
              conflict-of-law rules.
            </p>
            <p>
              Before anything formal happens, write to{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and give us thirty days to put
              it right. In our experience that resolves it, because we would rather fix a problem than
              win an argument.
            </p>
            <p>
              If it cannot be resolved that way, the state and federal courts serving Washtenaw
              County, Michigan have jurisdiction, and we both agree to that venue. Small claims court
              remains open to either of us for anything that qualifies.
            </p>

            <h2 id="changes">15. Changes to these terms</h2>
            <p>
              We may update this page. The version that governs your project is the one published on
              the day you paid your deposit — later changes do not apply retroactively to work already
              agreed. If we make a significant change, we email active clients rather than expecting
              you to notice.
            </p>

            <h2 id="misc">16. The remaining formalities</h2>
            <p>
              If any part of these terms turns out to be unenforceable, the rest still stands. If we
              do not enforce something immediately, we have not given up the right to enforce it
              later. You may not transfer this agreement to someone else without asking us first,
              although we will not be unreasonable about it if you sell the restaurant. These terms,
              the pricing page, the refunds page, and any written quote are the whole agreement
              between us.
            </p>

            <h2 id="contact">17. Contact</h2>
            <p>
              Anything about these terms goes to{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, or by post to {POSTAL_ADDRESS}.
            </p>
          </div>
        </Card>

        <Card size="lg" className="mt-6 p-6 text-center md:p-10">
          <h2 className="display text-[1.4rem] text-ink md:text-[1.6rem]">
            Something here you would want changed?
          </h2>
          <p className="mx-auto mt-3 max-w-[44ch] text-[0.975rem] leading-relaxed text-ink-2">
            These are our standard terms, not scripture. If a clause does not work for your
            restaurant, tell us before you sign anything.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ButtonLink href={`mailto:${CONTACT_EMAIL}`} size="md">
              Email {CONTACT_EMAIL}
            </ButtonLink>
            <ButtonLink href="/refunds" variant="outline" size="md">
              Refunds and cancellation
            </ButtonLink>
          </div>
        </Card>
      </div>
    </div>
  );
}

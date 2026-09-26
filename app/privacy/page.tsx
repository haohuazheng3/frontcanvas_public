import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, Eyebrow } from "@/components/ui";
import { ButtonLink } from "@/components/button";
import { CONTACT_EMAIL, POSTAL_ADDRESS } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What FrontCanvas collects, which companies process it, and exactly what our analytics records — including the form text and uploaded images captured by deep capture. Plus how to make it stop.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "August 14, 2026";

const TOC: { id: string; label: string }[] = [
  { id: "collect", label: "What we collect" },
  { id: "recording", label: "Session recording" },
  { id: "cookies", label: "Cookies" },
  { id: "processors", label: "Who else handles it" },
  { id: "email", label: "Where we got your address" },
  { id: "retention", label: "How long we keep it" },
  { id: "rights", label: "Your rights" },
  { id: "contact", label: "Contact" },
];

const PROCESSORS = [
  {
    name: "Clerk",
    role: "Sign-in",
    tone: "neutral",
    what: "Handles logging in. We use emailed one-time codes only, so there is no password to store and we never see one. Clerk holds your email address and the times you signed in.",
    href: "https://clerk.com/legal/privacy",
  },
  {
    name: "Stripe",
    role: "Payments",
    tone: "neutral",
    what: "Takes payment. Card numbers are typed on Stripe’s own hosted page and never touch our servers. We see your name, billing email, the last four digits, and whether the charge worked.",
    href: "https://stripe.com/privacy",
  },
  {
    name: "Neon",
    role: "Database",
    tone: "neutral",
    what: "The Postgres database where everything about your project lives: contact details, the concept we built, our notes, and the status of any order.",
    href: "https://neon.com/privacy-policy",
  },
  {
    name: "Cloudflare R2",
    role: "Image storage",
    tone: "neutral",
    what: "Stores photographs and screenshots — yours and ours — used in concepts and in finished sites.",
    href: "https://www.cloudflare.com/privacypolicy/",
  },
  {
    name: "Vercel",
    role: "Hosting",
    tone: "neutral",
    what: "Serves this website. Keeps short-lived server logs containing IP address, browser type, and the page requested.",
    href: "https://vercel.com/legal/privacy-policy",
  },
  {
    name: "FlowGlance",
    role: "Analytics and session recording",
    tone: "accent",
    what: "Records page views, clicks, and the shape of a visit. Because deep capture is switched on, it also records text typed into forms on this site and images uploaded through them. See the section above.",
    href: null,
  },
] as const;

const RETENTION: { what: string; how_long: string }[] = [
  { what: "Server logs at our host", how_long: "About 30 days" },
  { what: "Analytics and session recordings", how_long: "12 months, then deleted" },
  { what: "A concept we built for a restaurant that never replied", how_long: "12 months, then the concept and the contact record are both deleted" },
  { what: "Addresses of people who asked us to stop emailing", how_long: "Kept indefinitely, on a do-not-contact list only" },
  { what: "Account records", how_long: "While the account exists, plus 30 days after you ask us to close it" },
  { what: "Client project files and correspondence", how_long: "3 years after the final invoice, so we can support work we did" },
  { what: "Payment and invoice records", how_long: "7 years — US tax law requires it" },
];

export default function PrivacyPage() {
  return (
    <div className="shell py-14 md:py-24">
      <div className="mx-auto max-w-[54rem]">
        <header className="max-w-[44rem]">
          <Eyebrow>Legal</Eyebrow>
          <h1 className="display mt-3 text-[2.4rem] text-ink md:text-[3.4rem]">Privacy policy</h1>
          <p className="mt-5 text-[1.05rem] leading-relaxed text-ink-2">
            This is the plain version. It says what we actually collect, what our tools actually
            record, who else touches it, and how to make any of it stop.
          </p>
          <p className="mt-6 text-[0.85rem] text-ink-3">Last updated {UPDATED}</p>
        </header>

        {/* 短版本 —— 先给结论 */}
        <Card size="lg" className="mt-10 p-6 md:p-10">
          <h2 className="display text-[1.5rem] text-ink md:text-[1.75rem]">The short version</h2>
          <ul className="mt-5 space-y-3.5">
            {[
              "We are a small design studio. We collect the least we can and we do not sell any of it, ever.",
              "Our analytics records sessions on this site — including text typed into our forms and images uploaded through them. You can switch that off.",
              "Card numbers and passwords never reach our servers. Stripe and Clerk handle those on their own pages.",
              "If we emailed you out of the blue, your address came from your restaurant’s own public listing. One click stops it for good.",
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

          <nav aria-label="On this page" className="mt-8 border-t border-line pt-6">
            <h3 className="text-[0.75rem] font-semibold uppercase tracking-[0.09em] text-ink-3">
              On this page
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {TOC.map((t) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    className="tap inline-block rounded-[var(--r-full)] bg-surface-inset px-3.5 py-1.5 text-[0.82rem] font-medium text-ink-2 hover:text-ink"
                  >
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </Card>

        {/* deep capture 披露 —— 必须显眼 */}
        <Card size="lg" className="mt-6 overflow-hidden">
          <div className="bg-accent-soft px-6 py-8 md:px-10 md:py-10">
            <div className="flex flex-col gap-4 md:flex-row md:gap-5">
              <span
                aria-hidden="true"
                className="grid size-11 shrink-0 place-items-center rounded-[var(--r-md)] bg-surface"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.6" className="text-accent" />
                  <circle cx="10" cy="10" r="2.6" fill="currentColor" className="text-accent" />
                </svg>
              </span>
              <div>
                <Badge tone="accent">Read this one</Badge>
                <h2 className="display mt-3 text-[1.5rem] leading-[1.18] text-ink md:text-[1.9rem]">
                  Our analytics records what you type into our forms
                </h2>
                <p className="mt-4 text-[0.975rem] leading-relaxed text-ink-2">
                  We use FlowGlance for analytics, and we have its <strong className="font-semibold text-ink">deep capture</strong>{" "}
                  setting switched on. That means it does not simply count page views. It records the
                  sequence of a visit, including the text entered into forms on this site and the
                  images uploaded through them.
                </p>
                <p className="mt-3.5 text-[0.975rem] leading-relaxed text-ink-2">
                  We turned it on because it is the only reliable way to see where a restaurant owner
                  gets stuck halfway through a form, and then fix it. We would rather say so at the
                  top of the page than bury it in section nine. If you would rather not be recorded,
                  choose <span className="font-medium text-ink">Only what’s necessary</span> in the
                  cookie banner and nothing is recorded at all.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* 正文 */}
        <Card size="lg" className="mt-6 px-6 py-10 md:px-12 md:py-14">
          <div className="prose-fc [&>h2:first-child]:mt-0 [&>h2]:scroll-mt-24">
            <h2 id="who">Who you are dealing with</h2>
            <p>
              FrontCanvas is a small design studio in Michigan. We redesign websites for
              restaurants. We build a free concept first, email it to the restaurant, and only ask
              for money if they want it built for real. This policy covers frontcanvas.com, the
              concepts we send, and the email we send.
            </p>
            <p>
              Our postal address is {POSTAL_ADDRESS}. For anything in this policy, write to{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. A person reads it.
            </p>

            <h2 id="collect">What we collect, and why</h2>

            <h3>If you are only looking around</h3>
            <p>
              Our host records the usual server log entries: IP address, browser and device type,
              which page you asked for, and when. That happens for every website on the internet and
              we use it to keep the site up and to spot abuse. If you accept analytics, we also
              collect what is described in the next section.
            </p>

            <h3>If we emailed you a concept</h3>
            <p>
              Before we write to a restaurant we gather what is publicly published about it: the
              business name, address, phone number, business email, opening hours, menu, photographs
              on its own site or listing, and the state of its current website. We use that to build
              the concept and to write an email that is actually about your restaurant. We also
              record whether that email was delivered, opened, and whether you clicked. There is no
              personal profile behind this — it is business information about a business.
            </p>

            <h3>If you sign in</h3>
            <p>
              Your email address, and the times you signed in. Sign-in works by emailing you a
              one-time code, so there is no password. We could not leak your password if we tried,
              because we never had one.
            </p>

            <h3>If you become a client</h3>
            <p>
              Your name, business name, business address, phone number, email, the content you send
              us — menu text, photographs, logo files — and a record of what you paid and when. Card
              details are entered on Stripe’s own page and are never seen or stored by us.
            </p>

            <h3>If you write to us or fill in a form</h3>
            <p>
              Whatever you chose to put in the message, plus any file you attached or uploaded. Note
              that form contents are also captured by our session recording, as described below.
            </p>

            <h2 id="recording">Session recording and deep capture, in full</h2>
            <p>
              FlowGlance is our analytics tool and it runs with deep capture enabled. Here is exactly
              what that means for you.
            </p>
            <p>
              <strong>What it records:</strong> pages viewed, time on page, where you clicked and
              scrolled, the device and browser you used, the approximate city your IP resolves to,
              the text you type into forms on this site, and the images you upload through them.
            </p>
            <p>
              <strong>What it cannot record:</strong> your card number, expiry, or security code —
              those are entered on Stripe’s page, not ours, and our analytics does not run there.
              There is no password on this site, so there is no password to capture.
            </p>
            <p>
              <strong>One honest caveat:</strong> the sign-in code we email you is typed into a
              Clerk component that sits inside our page, so it can appear in a recording. The code is
              single-use and expires within minutes, which limits the damage, but you deserve to know
              rather than to assume.
            </p>
            <p>
              <strong>Who sees recordings:</strong> only the people who run this studio. They are
              never sold, never shared with advertisers, and never used to build a profile of you
              across other websites.
            </p>
            <p>
              <strong>How to switch it off:</strong> choose{" "}
              <span className="font-medium text-ink">Only what’s necessary</span> in the cookie
              banner. Your choice is stored on your own device and we stop recording. If your browser
              sends a Global Privacy Control signal, we treat that as a refusal automatically and
              never show you the banner at all.
            </p>

            <h2 id="cookies">Cookies and similar storage</h2>
            <p>
              We keep this short because our list is short.
            </p>
            <ul>
              <li>
                <strong>Necessary.</strong> A sign-in session cookie set by Clerk when you log in,
                and a record of your cookie choice stored in your browser’s local storage. Without
                these the site cannot do its job.
              </li>
              <li>
                <strong>Analytics.</strong> Set by FlowGlance, and only after you accept. Nothing is
                loaded or recorded before you choose.
              </li>
              <li>
                <strong>Advertising.</strong> None. No ad pixels, no retargeting tags, no social
                media trackers. We do not run ads and we do not feed anyone else’s.
              </li>
            </ul>
            <p>
              You can change your mind at any time by clearing this site’s data in your browser
              settings, which brings the banner back.
            </p>
          </div>

          {/* 第三方处理者 —— 逐个说明 */}
          <div className="mt-14">
            <h2 id="processors" className="display scroll-mt-24 text-[1.6rem] leading-[1.22] text-ink">
              Who else handles your information
            </h2>
            <p className="mt-4 max-w-[68ch] text-[1rem] leading-[1.72] text-ink-2">
              We do not build our own database software or payment system, so a handful of companies
              process data on our behalf. This is the complete list. Each one is bound by its own
              agreement with us, and each publishes its own privacy policy.
            </p>
            <ul className="mt-7 grid gap-3.5">
              {PROCESSORS.map((p) => (
                <li key={p.name} className="rounded-[var(--r-md)] bg-surface-inset p-5 md:p-6">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="text-[1.02rem] font-semibold text-ink">{p.name}</span>
                    <Badge tone={p.tone}>{p.role}</Badge>
                  </div>
                  <p className="mt-3 text-[0.94rem] leading-relaxed text-ink-2">{p.what}</p>
                  {p.href && (
                    <a
                      href={p.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="tap mt-3.5 inline-block text-[0.85rem] font-medium text-accent hover:text-accent-hover"
                    >
                      Their privacy policy
                    </a>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-[68ch] text-[1rem] leading-[1.72] text-ink-2">
              All of these companies are based in the United States, and your information is stored
              and processed there. We do not sell personal information, we do not trade it, and we do
              not share it for anyone’s advertising.
            </p>
          </div>

          <div className="prose-fc mt-14 [&>h2:first-child]:mt-0 [&>h2]:scroll-mt-24">
            <h2 id="email">Where we got your email address</h2>
            <p>
              We send business email to restaurants that never asked to hear from us. That is worth
              being straight about.
            </p>
            <ul>
              <li>
                <strong>The source is public.</strong> Your restaurant’s own website, your Google
                Business Profile, your public listings. We do not buy lists, we do not scrape
                personal inboxes, and we do not guess at addresses belonging to individuals.
              </li>
              <li>
                <strong>It goes to the business, about the business.</strong> The first email
                contains a concept we already built for your restaurant, at our own cost.
              </li>
              <li>
                <strong>Every email identifies us</strong> — who we are, our street address, and a
                one-click unsubscribe link that works without you having to reply or log in.
              </li>
              <li>
                <strong>We may follow up once or twice</strong> if there is no reply. Then we stop on
                our own.
              </li>
            </ul>
            <p>
              Unsubscribe requests are actioned within two business days, and always inside the ten
              business days that US law allows. After that we keep your address on a do-not-contact
              list — and nothing else — so that we do not accidentally write to you again a year from
              now. If you would also like the concept we built deleted, say so in the same message
              and it goes. You can unsubscribe from any email’s link, from the{" "}
              <Link href="/unsubscribe">unsubscribe page</Link>, or by writing to{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </div>

          {/* 保留期 */}
          <div className="mt-14">
            <h2 id="retention" className="display scroll-mt-24 text-[1.6rem] leading-[1.22] text-ink">
              How long we keep things
            </h2>
            <p className="mt-4 max-w-[68ch] text-[1rem] leading-[1.72] text-ink-2">
              Nothing is kept forever out of laziness. These are the periods we work to.
            </p>
            <ul className="mt-7 divide-y divide-line overflow-hidden rounded-[var(--r-md)] bg-surface-inset">
              {RETENTION.map((r) => (
                <li key={r.what} className="flex flex-col gap-1.5 p-5 md:flex-row md:items-baseline md:gap-6 md:p-6">
                  <span className="text-[0.94rem] font-semibold text-ink md:w-[19rem] md:shrink-0">
                    {r.what}
                  </span>
                  <span className="text-[0.94rem] leading-relaxed text-ink-2">{r.how_long}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="prose-fc mt-14 [&>h2:first-child]:mt-0 [&>h2]:scroll-mt-24">
            <h2 id="rights">Your rights, and how to use them</h2>
            <p>
              You can ask us to do any of the following, and we will not ask which state or country
              you live in before we do it.
            </p>
            <ul>
              <li>Tell you everything we hold about you or your restaurant.</li>
              <li>Correct anything that is wrong.</li>
              <li>Delete it — the concept, the notes, the contact record, all of it.</li>
              <li>Send you a copy in a format you can take elsewhere.</li>
              <li>Stop analytics and session recording, through the cookie banner.</li>
              <li>Stop the email, permanently.</li>
            </ul>
            <p>
              Write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We acknowledge within
              five business days and finish within thirty. There is no charge and no form to fill in.
              The only things we may have to keep are payment records the tax authorities require us
              to hold, and the do-not-contact entry that stops us writing to you again.
            </p>

            <h2 id="security">How we look after it</h2>
            <p>
              Everything travels over encrypted connections. Access to the database and to session
              recordings is limited to the people who run the studio. We store no passwords and no
              card numbers, because we deliberately never take them. We are a design studio, not a
              bank, so our real defence is keeping the number of places your information lives as
              small as possible.
            </p>
            <p>
              If something does go wrong and your information is exposed, we will tell you what
              happened and what we did about it, without waiting to be asked.
            </p>

            <h2 id="children">Children</h2>
            <p>
              This is a service for business owners. It is not directed at children, and we do not
              knowingly collect information from anyone under sixteen. If you believe a child has
              sent us something, write to us and we will delete it.
            </p>

            <h2 id="changes">Changes to this policy</h2>
            <p>
              If we change how we handle information, we update this page and change the date at the
              top. If the change is significant — a new processor, a new kind of collection — we
              email active clients rather than relying on you to check.
            </p>

            <h2 id="contact">Contact</h2>
            <p>
              Questions, requests, or complaints about anything on this page go to{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, or by post to {POSTAL_ADDRESS}.
            </p>
          </div>
        </Card>

        <Card size="lg" className="mt-6 p-6 text-center md:p-10">
          <h2 className="display text-[1.4rem] text-ink md:text-[1.6rem]">
            Want something deleted?
          </h2>
          <p className="mx-auto mt-3 max-w-[42ch] text-[0.975rem] leading-relaxed text-ink-2">
            Ask in one sentence. No form, no account, no explanation required.
          </p>
          <div className="mt-7">
            <ButtonLink href={`mailto:${CONTACT_EMAIL}`} size="md">
              Email {CONTACT_EMAIL}
            </ButtonLink>
          </div>
        </Card>
      </div>
    </div>
  );
}

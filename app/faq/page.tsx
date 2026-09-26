import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card, Eyebrow } from "@/components/ui";
import { ButtonLink } from "@/components/button";
import { CONTACT_EMAIL, POSTAL_ADDRESS } from "@/components/site-footer";
import { TIER_BY_ID, formatPrice, DEPOSIT_RATIO } from "@/lib/pricing";

const SITE = process.env.NEXT_PUBLIC_APP_URL || "https://frontcanvas.com";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Straight answers about the free concept we email restaurants: why it costs nothing, who else can see it, what a finished site costs, how long it takes, and how to stop hearing from us.",
  alternates: { canonical: "/faq" },
  openGraph: {
    type: "website",
    url: `${SITE}/faq`,
    title: "Frequently asked questions · FrontCanvas",
    description:
      "Why the concept is free, who else can see it, what it costs, and how to unsubscribe. Plain answers, no sales language.",
  },
};

/* ── 报价从 lib/pricing 读，禁止硬编码 ──────────────────── */
const LAUNCH = TIER_BY_ID.launch;
const COMPLETE = TIER_BY_ID.complete;
const CARE = TIER_BY_ID.care;
const LAUNCH_PRICE = formatPrice(LAUNCH.amountCents);
const COMPLETE_PRICE = formatPrice(COMPLETE.amountCents);
const CARE_PRICE = formatPrice(CARE.amountCents);
const DEPOSIT_PCT = `${Math.round(DEPOSIT_RATIO * 100)}%`;

/* ── 问答数据 ───────────────────────────────────────────
   答案拆成「片段」，纯文本片段与链接片段共用同一份数据：
   页面渲染与 FAQPage JSON-LD 都由它生成，两者永远逐字一致。 */

type Frag = string | { href: string; text: string };
type Para = Frag[];

interface QA {
  q: string;
  a: Para[];
}

interface Group {
  eyebrow: string;
  title: string;
  items: QA[];
}

const GROUPS: Group[] = [
  {
    eyebrow: "Start here",
    title: "The email you received",
    items: [
      {
        q: "I got an email with a website design for my restaurant. Is this a scam?",
        a: [
          [
            "It is not, and it is a fair question to ask. That email does not ask you for money, a password, a card number, or a signature, and there is no account to unlock and nothing to claim. It contains one link to a design we built for your restaurant, hosted on our own site.",
          ],
          [
            "If you would rather not open a link from someone you have never met, write to ",
            { href: `mailto:${CONTACT_EMAIL}`, text: CONTACT_EMAIL },
            " and we will send plain screenshots instead. Our studio address is ",
            POSTAL_ADDRESS,
            ", and it is printed at the bottom of every email we send.",
          ],
        ],
      },
      {
        q: "Why would you design a whole website for free?",
        a: [
          [
            "Because describing a website is a terrible way to sell one. The normal approach is a phone call, a proposal, and a deposit before anything exists, which asks you to trust a stranger with money and time you do not have to spare.",
          ],
          [
            "We would rather absorb the cost of the first draft and let the work make the argument. Most restaurants we send a concept to never reply, and that is simply the price of working this way. The ones who do reply already know exactly what they are getting.",
          ],
        ],
      },
      {
        q: "Can anyone else see the concept you made for my restaurant?",
        a: [
          [
            "No. It sits at a random, unguessable address that only you were sent. We never link to it from anywhere on this site, and the page tells search engines to skip it, so nobody turns it up by searching your restaurant.",
          ],
          [
            "Your real name and dishes are on the concept, because a version with the name stripped out would look like a stock template and you could not tell it was built for you. What keeps it private is the address, not a blanked-out sign. Ask us and it comes down the same day.",
          ],
        ],
      },
      {
        q: "Where are you based? Do you only work with restaurants in Michigan?",
        a: [
          [
            "The studio is at ",
            POSTAL_ADDRESS,
            ". We started in Michigan because it is where we eat, and because a state with this much good food should not have this many bad restaurant websites.",
          ],
          [
            "We work outward across southeast Michigan and remotely beyond it. The process does not change when you are further away; we just replace sitting in your dining room with a phone call. More about how the studio operates is on ",
            { href: "/about", text: "the about page" },
            ".",
          ],
        ],
      },
    ],
  },
  {
    eyebrow: "The commercial part",
    title: "Money and time",
    items: [
      {
        q: "What does it actually cost if I say yes?",
        a: [
          [
            `${LAUNCH.name} is ${LAUNCH_PRICE}, paid once: the entire site designed, built, and live on your own domain, with hosting and the domain covered for the first year.`,
          ],
          [
            `${COMPLETE.name} is ${COMPLETE_PRICE}, paid once, and adds the machinery — online ordering connected to your existing system, reservations, email capture, and analytics.`,
          ],
          [
            `${CARE.name} is ${CARE_PRICE} a month for unlimited edits, hosting, and backups, and you can cancel it any time. On the one-time builds we take ${DEPOSIT_PCT} up front and the rest when the site goes live. Everything is listed in full on `,
            { href: "/pricing", text: "the pricing page" },
            ".",
          ],
        ],
      },
      {
        q: "How long does it take to go live?",
        a: [
          [
            "The concept you were sent already exists, so the design stage is behind us. Turning it into a real site takes about two weeks for a ",
            LAUNCH.name,
            " build and about three for ",
            COMPLETE.name,
            ", counted from the day we have your menu, your real hours, and your photos.",
          ],
          [
            "The slow part is almost never the building. It is waiting on menu text and pictures, so the sooner those reach us, the sooner the site is up.",
          ],
        ],
      },
      {
        q: "What if I am not happy with it? Can I get my money back?",
        a: [
          [
            "You saw the design before you paid anything, which removes the usual reason for a refund. Beyond that: the deposit is fully refundable until we begin building, and if we have started and you decide to stop, you pay for the work already done and nothing further. We do not keep a deposit for a site that never launched.",
          ],
          [
            `Revisions are included — two rounds on ${LAUNCH.name}, three on ${COMPLETE.name} — and they are counted honestly, not used as a lever to bill you for changing your mind about a typeface. The full terms are on `,
            { href: "/refunds", text: "the refunds and cancellation page" },
            ".",
          ],
        ],
      },
    ],
  },
  {
    eyebrow: "Your current setup",
    title: "What you already have",
    items: [
      {
        q: "I already have a website through Wix, Squarespace, or GoDaddy. Do I have to throw it out?",
        a: [
          [
            "Nearly every restaurant we work with already has something — a template bought five years ago, or a page a relative built as a favour. That is normal and it is not a problem.",
          ],
          [
            "What matters is what a hungry stranger sees on a phone at six in the evening. We rebuild the design and rewrite the content; whether the new site lives on your current platform or somewhere better depends on what that platform charges you and what it will let us do. We will tell you plainly which option costs you less, including when the answer is to stay where you are.",
          ],
        ],
      },
      {
        q: "Can I keep my current domain name?",
        a: [
          [
            "Yes, and you should. Your domain is part of your name. It is printed on menus and takeout bags and it carries years of search history, and throwing it away costs you customers for no good reason.",
          ],
          [
            "We point it at the new site. If nobody at the restaurant remembers who set it up or where the login lives, we can usually trace where it is registered and walk you through recovering it. The domain stays registered in your name, never ours.",
          ],
        ],
      },
      {
        q: "Do I need to be technical? What do you actually need from me?",
        a: [
          [
            "Nothing technical, ever. We need your current menu in whatever form it exists — a PDF, a photo of the printed card, a chalkboard picture — plus your real hours and any photos you like of the food and the room.",
          ],
          [
            "Domains, hosting, security certificates, mobile testing, and search setup are our problem, not yours. If we need a decision from you, we will ask for it in plain English and give you a recommendation rather than a menu of options you have no way to judge.",
          ],
        ],
      },
    ],
  },
  {
    eyebrow: "The long term",
    title: "After it goes live",
    items: [
      {
        q: "Who updates the menu after the site launches?",
        a: [
          [
            "Either you or us, whichever you would rather. If you want to do it yourself we set up a simple editor and show you the three things you will actually use, and then we stay out of your way.",
          ],
          [
            `Most owners do not want that, which is what ${CARE.name} is for at ${CARE_PRICE} a month. You send the change however is easiest — a photo of the new printed menu, a document, a text message — and it is live the same week. There is no dashboard to learn and no ticket to file.`,
          ],
        ],
      },
      {
        q: "Can you connect the site to Toast, Square, or whatever we use for online orders?",
        a: [
          [
            "Yes, and we connect to the systems you already pay for rather than pushing you onto something new. Toast, Square, Clover, ChowNow, OpenTable, Resy and the other common ones are all fine, and the ordering button on your site sends people straight into the system your kitchen already prints tickets from.",
          ],
          [
            `That integration work is part of the ${COMPLETE.name} build at ${COMPLETE_PRICE}. If you are on something less common, tell us the name and we will confirm whether it will work before you pay anything.`,
          ],
        ],
      },
      {
        q: "Do you write the words and take the photographs as well?",
        a: [
          [
            "We write the words. Menu descriptions, the short piece about the room, and the copy on every page are included, and we will send it to you to correct before anything is published — you know your food better than we do.",
          ],
          [
            "Photography is not included. We work with the pictures you have and we are good at making ordinary phone photos sit well on a page. If the food genuinely deserves better we will say so and help you find someone local, but we will not quietly add a photographer to your invoice.",
          ],
        ],
      },
    ],
  },
  {
    eyebrow: "No hard feelings",
    title: "If the answer is not now",
    items: [
      {
        q: "I am interested, but not this month. Does the concept expire?",
        a: [
          [
            "The private link stays up for a good while, and if it has gone dark by the time you come back, email us and we will put it up again.",
          ],
          [
            "We do not run countdown timers, price-expires-Friday emails, or last-chance reminders. Those are tactics for people whose work cannot speak for itself. Tell us roughly when the season is better for you and we will come back then.",
          ],
        ],
      },
      {
        q: "How do I stop getting emails from you?",
        a: [
          [
            "Every email we send carries an unsubscribe link at the bottom and it works on the first click — no login, no survey asking why, no confirmation email. You can also go to ",
            { href: "/unsubscribe", text: "the unsubscribe page" },
            " and enter your address, or simply reply with the word stop.",
          ],
          [
            "Once you are off the list you are off it permanently. We do not add addresses back, and we do not sell, rent, or share the list with anyone.",
          ],
        ],
      },
    ],
  },
];

/* 把片段拍平成纯文本 —— JSON-LD 的答案与页面可见文字逐字相同 */
function plainText(a: Para[]): string {
  return a
    .map((para) => para.map((f) => (typeof f === "string" ? f : f.text)).join(""))
    .join(" ");
}

const ALL_ITEMS = GROUPS.flatMap((g) => g.items);

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${SITE}/faq`,
  mainEntity: ALL_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: plainText(item.a),
    },
  })),
};

/* details 展开过渡。不支持 ::details-content 的浏览器会忽略这几条规则，
   折叠依旧可用，只是没有高度动画 —— 渐进增强。 */
const FAQ_CSS = `
.faq-list { interpolate-size: allow-keywords; }
.faq-item::details-content {
  block-size: 0;
  overflow: hidden;
  transition: block-size 0.36s cubic-bezier(0.16, 1, 0.3, 1),
    content-visibility 0.36s allow-discrete;
}
.faq-item[open]::details-content { block-size: auto; }
`;

function Answer({ a }: { a: Para[] }) {
  return (
    <>
      {a.map((para, i) => (
        <p
          key={i}
          className={`text-[0.975rem] leading-relaxed text-ink-2 ${i > 0 ? "mt-3.5" : ""}`}
        >
          {para.map((frag, j) => {
            if (typeof frag === "string") return <span key={j}>{frag}</span>;
            const external = /^(https?:|mailto:)/.test(frag.href);
            const cls =
              "text-accent underline decoration-accent-line underline-offset-[3px] hover:text-accent-hover";
            return external ? (
              <a key={j} href={frag.href} className={cls}>
                {frag.text}
              </a>
            ) : (
              <Link key={j} href={frag.href} className={cls}>
                {frag.text}
              </Link>
            );
          })}
        </p>
      ))}
    </>
  );
}

function Item({ item }: { item: QA }) {
  return (
    <Card as="li" size="sm" className="overflow-hidden">
      <details className="faq-item group">
        <summary className="tap flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-5 md:px-7 md:py-6 [&::-webkit-details-marker]:hidden">
          <h3 className="text-[1rem] font-semibold leading-snug text-ink md:text-[1.06rem]">
            {item.q}
          </h3>
          <span
            className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-[var(--r-full)] bg-surface-inset text-ink-2 transition-transform duration-300 group-open:rotate-45"
            aria-hidden="true"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1.6v8.8M1.6 6h8.8"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </summary>
        <div className="fade px-5 pb-6 md:px-7 md:pb-7">
          <div className="max-w-[62ch] border-t border-line pt-5">
            <Answer a={item.a} />
          </div>
        </div>
      </details>
    </Card>
  );
}

export default function FaqPage(): ReactNode {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
      <style>{FAQ_CSS}</style>

      {/* ── 开场 ───────────────────────────────────────── */}
      <section className="shell pt-14 pb-6 md:pt-24 md:pb-10">
        <div className="max-w-[46rem]">
          <Eyebrow>Questions</Eyebrow>
          <h1 className="display mt-4 text-[2.35rem] leading-[1.06] text-ink md:text-[3.4rem]">
            The things restaurant owners actually ask us.
          </h1>
          <p className="mt-6 max-w-[40rem] text-[1.08rem] leading-relaxed text-ink-2 md:text-[1.15rem]">
            Mostly some version of &ldquo;what is the catch&rdquo;, which is the right instinct.
            Here are the answers, written the way we would give them across a table.
          </p>
        </div>
      </section>

      {/* ── 问答 ───────────────────────────────────────── */}
      <div className="faq-list shell pb-4">
        {GROUPS.map((group) => (
          <section key={group.title} className="pt-12 md:pt-16" aria-labelledby={slug(group.title)}>
            <Eyebrow>{group.eyebrow}</Eyebrow>
            <h2
              id={slug(group.title)}
              className="display mt-3 mb-7 text-[1.7rem] text-ink md:mb-9 md:text-[2.1rem]"
            >
              {group.title}
            </h2>
            <ul className="grid gap-3.5">
              {group.items.map((item) => (
                <Item key={item.q} item={item} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* ── 收尾 ───────────────────────────────────────── */}
      <section className="shell pt-16 md:pt-24">
        <Card size="xl" className="px-6 py-12 text-center md:px-14 md:py-16">
          <h2 className="display mx-auto max-w-[20ch] text-[1.9rem] leading-[1.1] text-ink md:text-[2.5rem]">
            Still not answered?
          </h2>
          <p className="mx-auto mt-5 max-w-[44ch] text-[1rem] leading-relaxed text-ink-2">
            Write to us in one line, however blunt. A real person reads it and replies within one
            business day — and no, replying does not sign you up for anything.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href={`mailto:${CONTACT_EMAIL}`} size="lg">
              Email the studio
            </ButtonLink>
            <ButtonLink href="/pricing" variant="outline" size="lg">
              See what it costs
            </ButtonLink>
          </div>
          <p className="mt-6 text-[0.85rem] text-ink-3">{CONTACT_EMAIL}</p>
        </Card>
      </section>
    </>
  );
}

function slug(s: string): string {
  return `faq-${s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

import type { Metadata } from "next";
import Link from "next/link";
import { Card, Eyebrow } from "@/components/ui";
import { CONTACT_EMAIL } from "@/components/site-footer";
import { TIERS, formatPrice } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Page not found",
  description:
    "That address does not lead anywhere. Here is the way back to FrontCanvas — what we do, what it costs, and how to reach us.",
  robots: { index: false, follow: true },
};

/** 起步价从报价源读，永不硬编码 */
const oneTime = TIERS.filter((t) => t.interval === null);
const cheapest = oneTime.reduce((min, t) => (t.amountCents < min.amountCents ? t : min), oneTime[0]);

const DESTINATIONS = [
  {
    href: "/",
    label: "Start at the beginning",
    body: "What we do, and why you get to see the design before you pay for it.",
  },
  {
    href: "/pricing",
    label: "See what it costs",
    body: `Finished sites start at ${formatPrice(cheapest.amountCents)}. No quotes, no discovery calls.`,
  },
  {
    href: "/contact",
    label: "Talk to a person",
    body: "One email, answered within a business day. Usually by the person who would design your site.",
  },
];

function Arrow() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-ink-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-accent"
    >
      <path
        d="M4 9h10m0 0-4-4m4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function NotFound() {
  return (
    <div className="shell py-16 md:py-28">
      <Card size="xl" className="rise mx-auto max-w-[48rem] px-6 py-12 md:px-14 md:py-16">
        <Eyebrow>Page not found</Eyebrow>

        <h1 className="display mt-4 text-[2.1rem] text-ink md:text-[2.9rem]">
          This page isn&rsquo;t on the menu
        </h1>

        <p className="mt-5 max-w-[44ch] text-[1.05rem] leading-relaxed text-ink-2">
          The link is either out of date or we moved something. Nothing is broken on your end &mdash;
          this address simply doesn&rsquo;t lead anywhere.
        </p>

        <nav aria-label="Where to go next">
          <ul className="mt-10 grid gap-3">
            {DESTINATIONS.map((d) => (
              <li key={d.href}>
                <Link
                  href={d.href}
                  className="tap group flex items-center gap-4 rounded-[var(--r-md)] bg-surface-inset px-5 py-4 hover:bg-accent-soft"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[1rem] font-semibold text-ink">{d.label}</span>
                    <span className="mt-1 block text-[0.9rem] leading-relaxed text-ink-2">
                      {d.body}
                    </span>
                  </span>
                  <Arrow />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-10 max-w-[52ch] text-[0.9rem] leading-relaxed text-ink-3">
          Were you looking for a concept we designed for your restaurant? Those links are
          one of a kind. Check the email we sent, or write to{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-medium text-accent underline underline-offset-[3px] hover:text-accent-hover"
          >
            {CONTACT_EMAIL}
          </a>{" "}
          and we&rsquo;ll send it again.
        </p>
      </Card>
    </div>
  );
}

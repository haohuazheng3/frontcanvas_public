import type { Metadata } from "next";
import Link from "next/link";
import { Card, Eyebrow, Section } from "@/components/ui";
import { ContactForm } from "@/components/contact-form";
import { CONTACT_EMAIL, POSTAL_ADDRESS } from "@/components/site-footer";
import { TIERS, formatPrice } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to the studio about your restaurant's website. Email contact@frontcanvas.com or send a note — a person replies within one business day.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact FrontCanvas",
    description:
      "Tell us about your restaurant. If it is a fit, we design a concept for your site and send it over before any talk of money.",
    url: "/contact",
  },
};

/** 起价从报价单里算，永远不写死数字 */
const STARTS_AT = formatPrice(
  Math.min(...TIERS.filter((t) => !t.interval).map((t) => t.amountCents))
);

const STEPS: { n: string; title: string; body: string }[] = [
  {
    n: "01",
    title: "A person reads it",
    body: "No ticket number, no chatbot, no discovery call to schedule. One of us reads what you wrote and answers you directly.",
  },
  {
    n: "02",
    title: "We design before we quote",
    body: "If your restaurant is a fit, we build a concept for your new site — your menu, your room, your food. Not a template with your logo dropped into it.",
  },
  {
    n: "03",
    title: "You decide with the work in front of you",
    body: "The concept lands in your inbox. Like it, and we build it for real. Don't, and you have lost nothing but the minutes it took to write to us.",
  },
];

export default function ContactPage() {
  return (
    <Section>
      <header className="mb-10 max-w-[46rem] md:mb-14">
        <Eyebrow>Contact</Eyebrow>
        <h1 className="display mt-3 text-[2rem] leading-[1.08] text-ink md:text-[2.9rem]">
          Tell us about your restaurant
        </h1>
        <p className="mt-5 max-w-[38rem] text-[1.05rem] leading-relaxed text-ink-2">
          Where you are, what you cook, and what bothers you about the website you have now. If it
          is a fit, we design a new one and send it over before any talk of money.{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-medium text-accent underline decoration-accent-line underline-offset-4 hover:text-accent-hover"
          >
            Or just email us.
          </a>
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[1.12fr_0.88fr] md:items-start md:gap-8">
        <ContactForm />

        <aside className="grid gap-6">
          <Card size="lg" className="p-7 md:p-8">
            <h2 className="display text-[1.35rem] text-ink">The short version</h2>
            <dl className="mt-6 space-y-6">
              <div>
                <dt className="text-[0.72rem] font-semibold tracking-[0.11em] text-ink-3 uppercase">
                  Email
                </dt>
                <dd className="mt-1.5">
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="tap text-[0.975rem] font-medium break-all text-accent hover:text-accent-hover"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </dd>
              </div>

              <div>
                <dt className="text-[0.72rem] font-semibold tracking-[0.11em] text-ink-3 uppercase">
                  Reply time
                </dt>
                <dd className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-2">
                  Within one business day — a written reply from a person, not an auto-responder.
                </dd>
              </div>

              <div>
                <dt className="text-[0.72rem] font-semibold tracking-[0.11em] text-ink-3 uppercase">
                  Studio
                </dt>
                <dd className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-2">
                  <address className="not-italic">{POSTAL_ADDRESS}</address>
                  <span className="mt-1.5 block text-ink-3">
                    We start with kitchens across Michigan, and work outward from
                    there.
                  </span>
                </dd>
              </div>
            </dl>
          </Card>

          <Card size="lg" className="p-7 md:p-8">
            <h2 className="display text-[1.35rem] text-ink">What happens next</h2>
            <ol className="mt-6 space-y-6">
              {STEPS.map((s) => (
                <li key={s.n} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-[var(--r-full)] bg-accent-soft text-[0.7rem] font-semibold text-accent"
                  >
                    {s.n}
                  </span>
                  <div>
                    <h3 className="text-[0.95rem] font-semibold text-ink">{s.title}</h3>
                    <p className="mt-1.5 text-[0.9rem] leading-relaxed text-ink-2">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-7 text-[0.875rem] leading-relaxed text-ink-3">
              Builds start at {STARTS_AT}. Every number is published on the{" "}
              <Link
                href="/pricing"
                className="tap font-medium text-accent underline decoration-accent-line underline-offset-4 hover:text-accent-hover"
              >
                pricing page
              </Link>
              . Nothing is quoted in private.
            </p>
          </Card>
        </aside>
      </div>
    </Section>
  );
}

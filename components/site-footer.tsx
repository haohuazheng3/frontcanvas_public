import Link from "next/link";
import { Logo } from "./logo";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Service",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
      { href: "/faq", label: "FAQ" },
      { href: "/blog", label: "Journal" },
    ],
  },
  {
    title: "Studio",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/refunds", label: "Refunds & cancellation" },
      { href: "/unsubscribe", label: "Unsubscribe" },
    ],
  },
];

// CAN-SPAM 要求邮件中带真实实体地址；站点上同样公示，保持一致
export const POSTAL_ADDRESS = "3120 Oak Valley Dr, Ann Arbor, MI 48103";
export const CONTACT_EMAIL = "contact@frontcanvas.com";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-28 pb-10 md:mt-40">
      <div className="shell">
        <div className="float-lg overflow-hidden px-6 py-10 md:px-12 md:py-14">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-8">
            <div>
              <Logo size={26} />
              <p className="mt-4 max-w-[30ch] text-[0.925rem] leading-relaxed text-ink-2">
                A small studio that redesigns restaurant websites so they finally look as good as
                the food.
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="tap mt-5 inline-block text-[0.925rem] font-medium text-accent hover:text-accent-hover"
              >
                {CONTACT_EMAIL}
              </a>
              <p className="mt-1 text-[0.8rem] text-ink-3">We reply within one business day.</p>
            </div>

            {COLUMNS.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h2 className="text-[0.75rem] font-semibold uppercase tracking-[0.09em] text-ink-3">
                  {col.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="tap text-[0.925rem] text-ink-2 hover:text-ink"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-line pt-7 text-[0.82rem] text-ink-3 md:flex-row md:items-center md:justify-between">
            <p>© {year} FrontCanvas. All rights reserved.</p>
            <address className="not-italic">{POSTAL_ADDRESS}</address>
          </div>
        </div>
      </div>
    </footer>
  );
}

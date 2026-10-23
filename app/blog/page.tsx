import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/button";
import { Card, EmptyState, Eyebrow } from "@/components/ui";
import {
  CATEGORIES,
  categoryHref,
  formatPostDate,
  getCategory,
  getFeaturedPosts,
  postHref,
} from "@/lib/blog";

export const metadata: Metadata = {
  title: "Restaurant website advice, in plain English",
  description:
    "Short, practical notes for restaurant owners on websites, showing up on Google, menus, photos, and the cost of every online order. No jargon.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: "/blog",
    title: "Restaurant website advice, in plain English · FrontCanvas",
    description:
      "Short, practical notes for restaurant owners on websites, showing up on Google, menus, photos, and the cost of every online order.",
  },
};

function Arrow() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h9.5M9 4.5 12.5 8 9 11.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function BlogIndexPage() {
  const featured = await getFeaturedPosts(3);

  return (
    <div className="pb-20 md:pb-28">
      {/* ── 开场 ── */}
      <section className="shell pt-12 md:pt-20">
        <div className="max-w-[46rem]">
          <Eyebrow>Field notes</Eyebrow>
          <h1 className="display mt-4 text-[2.4rem] leading-[1.06] text-ink md:text-[3.4rem]">
            Everything we learned rebuilding restaurant websites
          </h1>
          <p className="mt-6 max-w-[38rem] text-[1.05rem] leading-relaxed text-ink-2">
            Written for owners, not developers. No jargon, no funnels, no growth hacks. Just what we
            keep running into when we take a good restaurant with a bad website and fix the front of
            it.
          </p>
        </div>
      </section>

      {/* ── 分类导航 ── */}
      <section className="shell mt-12 md:mt-16" aria-labelledby="sections-heading">
        <h2 id="sections-heading" className="sr-only">
          Sections
        </h2>
        <ul className="grid gap-4 md:grid-cols-2 md:gap-6">
          {CATEGORIES.map((c) => (
            <Card
              key={c.slug}
              as="li"
              hover
              size="lg"
              className="relative flex flex-col p-7 md:p-9"
            >
              <h3 className="display text-[1.45rem] leading-[1.15] text-ink md:text-[1.7rem]">
                <Link
                  href={categoryHref(c)}
                  className="rounded-[var(--r-sm)] after:absolute after:inset-0 after:content-['']"
                >
                  {c.title}
                </Link>
              </h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-2">{c.blurb}</p>
              <span
                className="mt-6 inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-accent"
                aria-hidden="true"
              >
                Read this section
                <Arrow />
              </span>
            </Card>
          ))}
        </ul>
      </section>

      {/* ── 精选位 ── */}
      <section className="shell mt-16 md:mt-24" aria-labelledby="latest-heading">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3 md:mb-10">
          <h2 id="latest-heading" className="display text-[1.75rem] text-ink md:text-[2.2rem]">
            Latest
          </h2>
          {featured.length > 0 && (
            <p className="text-[0.875rem] text-ink-3">Newest first</p>
          )}
        </div>

        {featured.length === 0 ? (
          <EmptyState
            title="Still writing"
            body="Nothing published yet. We would rather post nothing than post filler, so the first pieces go up when they are actually worth your time."
            action={
              <ButtonLink href="/how-it-works" variant="outline" size="md">
                See how we work instead
              </ButtonLink>
            }
          />
        ) : (
          <ol className="grid gap-4 md:grid-cols-2 md:gap-6">
            {featured.map((p) => {
              const cat = getCategory(p.category);
              return (
                <Card key={p.slug} as="li" hover className="relative flex flex-col p-6 md:p-8">
                  {cat && (
                    <p className="text-[0.75rem] font-semibold uppercase tracking-[0.11em] text-ink-3">
                      {cat.title}
                    </p>
                  )}
                  <h3 className="display mt-3 text-[1.25rem] leading-[1.2] text-ink md:text-[1.4rem]">
                    <Link
                      href={postHref(p)}
                      className="rounded-[var(--r-sm)] after:absolute after:inset-0 after:content-['']"
                    >
                      {p.title}
                    </Link>
                  </h3>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-2">{p.excerpt}</p>
                  <p className="mt-6 text-[0.8rem] text-ink-3">
                    <time dateTime={p.publishedAt}>{formatPostDate(p.publishedAt)}</time>
                    <span aria-hidden="true"> · </span>
                    {p.readingMinutes} min read
                  </p>
                </Card>
              );
            })}
          </ol>
        )}
      </section>

      {/* ── 收尾：全站最该反复讲的信任点 ── */}
      <section className="shell mt-16 md:mt-24">
        <Card size="lg" className="p-8 md:p-14">
          <div className="max-w-[34rem]">
            <h2 className="display text-[1.7rem] leading-[1.12] text-ink md:text-[2.1rem]">
              You do not have to read any of this
            </h2>
            <p className="mt-5 text-[1.02rem] leading-relaxed text-ink-2">
              We would rather show you. We design a complete new front page for your restaurant
              first, at no cost, and send it over. You look at the finished thing before you decide
              anything, and before you pay us a dollar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/how-it-works" size="lg">
                How it works
              </ButtonLink>
              <ButtonLink href="/pricing" variant="outline" size="lg">
                What it costs
              </ButtonLink>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

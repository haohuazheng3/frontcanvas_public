import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/button";
import { Card, EmptyState, Eyebrow } from "@/components/ui";
import {
  CATEGORIES,
  SITE_URL,
  categoryHref,
  formatPostDate,
  getCategory,
  getPostsByCategory,
  postHref,
} from "@/lib/blog";

type Params = { category: string };

/** 四个分类全部静态预渲染 */
export function generateStaticParams(): Params[] {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) return { title: "Not found", robots: { index: false, follow: false } };

  const url = categoryHref(cat);
  return {
    title: cat.title,
    description: cat.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${cat.title} · FrontCanvas`,
      description: cat.description,
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();

  const posts = await getPostsByCategory(cat.slug);
  const others = CATEGORIES.filter((c) => c.slug !== cat.slug);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      {
        "@type": "ListItem",
        position: 3,
        name: cat.title,
        item: `${SITE_URL}${categoryHref(cat)}`,
      },
    ],
  };

  return (
    <div className="pb-20 md:pb-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* ── 面包屑 ── */}
      <nav aria-label="Breadcrumb" className="shell pt-8 md:pt-12">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8rem] text-ink-3">
          <li>
            <Link href="/" className="tap rounded-[var(--r-xs)] hover:text-ink">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/blog" className="tap rounded-[var(--r-xs)] hover:text-ink">
              Blog
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-2" aria-current="page">
            {cat.title}
          </li>
        </ol>
      </nav>

      {/* ── 标题与导读 ── */}
      <section className="shell pt-6 md:pt-10">
        <div className="max-w-[46rem]">
          <Eyebrow>Field notes</Eyebrow>
          <h1 className="display mt-4 text-[2.2rem] leading-[1.06] text-ink md:text-[3.1rem]">
            {cat.title}
          </h1>
          <p className="mt-6 max-w-[38rem] text-[1.05rem] leading-relaxed text-ink-2">
            {cat.intro}
          </p>
        </div>
      </section>

      {/* ── 文章列表 ── */}
      <section className="shell mt-10 md:mt-14" aria-labelledby="posts-heading">
        <h2 id="posts-heading" className="sr-only">
          Articles in {cat.title}
        </h2>

        {posts.length === 0 ? (
          <EmptyState
            title="Still writing"
            body="This section has nothing in it yet. We write these one at a time, out of real conversations with owners, so it fills up slowly and on purpose."
            action={
              <ButtonLink href="/blog" variant="outline" size="md">
                Back to all sections
              </ButtonLink>
            }
          />
        ) : (
          <ol className="grid gap-4 md:gap-5">
            {posts.map((p) => (
              <Card key={p.slug} as="li" hover className="relative p-6 md:p-8">
                <h3 className="display text-[1.3rem] leading-[1.2] text-ink md:text-[1.5rem]">
                  <Link
                    href={postHref(p)}
                    className="rounded-[var(--r-sm)] after:absolute after:inset-0 after:content-['']"
                  >
                    {p.title}
                  </Link>
                </h3>
                <p className="mt-3 max-w-[46rem] text-[0.95rem] leading-relaxed text-ink-2">
                  {p.excerpt}
                </p>
                <p className="mt-5 text-[0.8rem] text-ink-3">
                  <time dateTime={p.publishedAt}>{formatPostDate(p.publishedAt)}</time>
                  <span aria-hidden="true"> · </span>
                  {p.readingMinutes} min read
                </p>
              </Card>
            ))}
          </ol>
        )}
      </section>

      {/* ── 其余分类 ── */}
      <section className="shell mt-16 md:mt-24" aria-labelledby="other-sections-heading">
        <h2
          id="other-sections-heading"
          className="display text-[1.5rem] text-ink md:text-[1.85rem]"
        >
          Other sections
        </h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3 md:gap-5">
          {others.map((c) => (
            <Card key={c.slug} as="li" hover size="sm" className="relative p-6">
              <h3 className="text-[1rem] font-semibold text-ink">
                <Link
                  href={categoryHref(c)}
                  className="rounded-[var(--r-sm)] after:absolute after:inset-0 after:content-['']"
                >
                  {c.title}
                </Link>
              </h3>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-2">{c.blurb}</p>
            </Card>
          ))}
        </ul>
      </section>
    </div>
  );
}

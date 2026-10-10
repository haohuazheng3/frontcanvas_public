import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/button";
import { Card } from "@/components/ui";
import {
  ORG_NAME,
  SITE_URL,
  categoryHref,
  formatPostDate,
  getAdjacentPosts,
  getAllPosts,
  getCategory,
  getPost,
  postHref,
} from "@/lib/blog";

type Params = { category: string; slug: string };

/**
 * 现在没有文章 —— 返回空数组，构建期不预渲染任何文章页。
 * SEO 流程往 lib/blog.ts 里加文章后，这里会自动把每篇静态化。
 * 其余未知路径按需渲染，走下面的 notFound()。
 */
export async function generateStaticParams(): Promise<Params[]> {
  const posts = await getAllPosts();
  return posts.map((p) => ({ category: p.category, slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const post = await getPost(category, slug);
  if (!post) return { title: "Not found", robots: { index: false, follow: false } };

  const url = postHref(post);
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: `${post.title} · FrontCanvas`,
      description: post.description,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [ORG_NAME],
    },
  };
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { category, slug } = await params;
  const post = await getPost(category, slug);
  if (!post) notFound();

  const cat = getCategory(post.category);
  if (!cat) notFound();

  const { prev, next } = await getAdjacentPosts(post);
  const url = `${SITE_URL}${postHref(post)}`;
  const wasUpdated = post.updatedAt.slice(0, 10) !== post.publishedAt.slice(0, 10);
  const Body = post.Body;

  /** 作者与发布者都是机构，不挂个人名 */
  const publisher = {
    "@type": "Organization",
    name: ORG_NAME,
    url: SITE_URL,
  };

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: publisher,
    publisher,
    articleSection: cat.title,
    inLanguage: "en-US",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  };

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
      { "@type": "ListItem", position: 4, name: post.title, item: url },
    ],
  };

  return (
    <div className="pb-20 md:pb-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
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
          <li>
            <Link href={categoryHref(cat)} className="tap rounded-[var(--r-xs)] hover:text-ink">
              {cat.title}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="max-w-full truncate text-ink-2" aria-current="page">
            {post.title}
          </li>
        </ol>
      </nav>

      {/* ── 正文 ── */}
      <section className="shell pt-6 md:pt-10">
        <Card as="article" size="lg" className="mx-auto max-w-[52rem] p-7 md:p-14">
          <header>
            <Link
              href={categoryHref(cat)}
              className="tap inline-block rounded-[var(--r-xs)] text-[0.75rem] font-semibold uppercase tracking-[0.11em] text-accent hover:text-accent-hover"
            >
              {cat.title}
            </Link>
            <h1 className="display mt-4 text-[2rem] leading-[1.08] text-ink md:text-[2.9rem]">
              {post.title}
            </h1>
            <p className="mt-5 text-[1.05rem] leading-relaxed text-ink-2">{post.description}</p>

            {/* 可见的发布 / 更新日期 */}
            <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8rem] text-ink-3">
              <span>
                Published{" "}
                <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
              </span>
              {wasUpdated && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    Updated <time dateTime={post.updatedAt}>{formatPostDate(post.updatedAt)}</time>
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>{post.readingMinutes} min read</span>
              <span aria-hidden="true">·</span>
              <span>By {ORG_NAME}</span>
            </div>
          </header>

          <div className="mt-9 h-px bg-line" />

          <div className="prose-fc mt-9">{Body ? <Body /> : null}</div>
        </Card>
      </section>

      {/* ── 上一篇 / 下一篇 ── */}
      {(prev || next) && (
        <section className="shell mt-10 md:mt-14" aria-labelledby="more-heading">
          <h2 id="more-heading" className="sr-only">
            More from {cat.title}
          </h2>
          <div className="mx-auto grid max-w-[52rem] gap-4 md:grid-cols-2 md:gap-5">
            {prev && (
              <Card hover className="relative p-6">
                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.11em] text-ink-3">
                  Previous
                </p>
                <h3 className="display mt-2.5 text-[1.15rem] leading-[1.22] text-ink">
                  <Link
                    href={postHref(prev)}
                    className="rounded-[var(--r-sm)] after:absolute after:inset-0 after:content-['']"
                  >
                    {prev.title}
                  </Link>
                </h3>
              </Card>
            )}
            {next && (
              <Card hover className="relative p-6 md:col-start-2 md:text-right">
                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.11em] text-ink-3">
                  Next
                </p>
                <h3 className="display mt-2.5 text-[1.15rem] leading-[1.22] text-ink">
                  <Link
                    href={postHref(next)}
                    className="rounded-[var(--r-sm)] after:absolute after:inset-0 after:content-['']"
                  >
                    {next.title}
                  </Link>
                </h3>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* ── 收尾 ── */}
      <section className="shell mt-12 md:mt-20">
        <Card size="lg" className="mx-auto max-w-[52rem] p-8 md:p-12">
          <h2 className="display text-[1.55rem] leading-[1.12] text-ink md:text-[1.95rem]">
            Rather see it than read about it
          </h2>
          <p className="mt-4 max-w-[38rem] text-[1rem] leading-relaxed text-ink-2">
            We design a complete new front page for your restaurant first, at no cost, and send it
            to you. You decide after you have seen the finished thing.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="/how-it-works" size="lg">
              How it works
            </ButtonLink>
            <ButtonLink href={categoryHref(cat)} variant="outline" size="lg">
              More on {cat.title.toLowerCase()}
            </ButtonLink>
          </div>
        </Card>
      </section>
    </div>
  );
}

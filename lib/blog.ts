/**
 * 博客数据层 —— 全站文章与分类的唯一真相源。
 *
 * 现在 POSTS 是空的：上线首日没有文章，页面就诚实地显示空态，不假装有内容。
 * 后续 SEO 流程（定时任务写稿 → 人工过一遍 → 落盘）会把 MDX 文章塞进
 * POSTS 里：每篇文章编译成一个组件挂在 `Body` 上，其余字段是元数据。
 * 届时只需替换 POSTS 的来源（例如 `import.meta.glob` 或 content collection），
 * 下面这几个函数的签名不用动，页面一行都不用改。
 *
 * 分类是骨架的关键：文章按 /blog/[category]/[slug] 落位，
 * 将来一百篇也不会堆成一张超长的 /blog 单页。
 */

import type { ComponentType } from "react";

/* ── 常量 ─────────────────────────────────────────────── */

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://frontcanvas.com";

/** JSON-LD 里的作者/发布者 —— 永远是机构，不是某个人名 */
export const ORG_NAME = "FrontCanvas";

/* ── 分类 ─────────────────────────────────────────────── */

export const CATEGORY_SLUGS = [
  "restaurant-websites",
  "getting-found-online",
  "menus-and-photos",
  "running-the-business",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export interface Category {
  slug: CategorySlug;
  /** 枢纽页 H1 与卡片标题 */
  title: string;
  /** <meta name="description"> —— 面向真实搜索意图写 */
  description: string;
  /** 卡片上的一句话，比 description 短 */
  blurb: string;
  /** 枢纽页顶部的导读段落 */
  intro: string;
}

export const CATEGORIES: Category[] = [
  {
    slug: "restaurant-websites",
    title: "Restaurant websites",
    description:
      "What makes a restaurant website worth visiting, and the small things that quietly send hungry people somewhere else to eat.",
    blurb: "What works, what turns people away, and what a site actually needs.",
    intro:
      "Most restaurant websites were built once, years ago, by a template that never quite fit. These are the parts that matter to a hungry person holding a phone at six in the evening, and the parts you can safely ignore.",
  },
  {
    slug: "getting-found-online",
    title: "Getting found online",
    description:
      "How people actually find a place to eat: Google, Maps, and the listings that decide whether your restaurant shows up at all.",
    blurb: "Google, Maps, listings, and how hungry people end up at your door.",
    intro:
      "Almost nobody types your name into Google. They type thai food near me at 6:40pm and choose from whatever comes back. This section is about being in that list, and looking worth choosing once you are.",
  },
  {
    slug: "menus-and-photos",
    title: "Menus and photos",
    description:
      "Menus people can read on a phone without pinching, and photos of your food that do not undersell what comes out of the kitchen.",
    blurb: "Readable menus, honest photos, and the PDF problem.",
    intro:
      "Your menu and your photos do more selling than any paragraph on the page. Most restaurants post a PDF and lose the customer somewhere around the third pinch to zoom. Here is what to do instead.",
  },
  {
    slug: "running-the-business",
    title: "Running the business",
    description:
      "The operating side of being a restaurant online: reviews, reservations, delivery commissions, holiday hours, and the phone ringing during service.",
    blurb: "Reviews, reservations, delivery apps, and the cost of every cover.",
    intro:
      "Everything around the website that still lands on your desk. Reviews you did not ask for, third parties taking a cut of each order, holiday hours nobody updated, and a phone that rings hardest at seven.",
  },
];

const CATEGORY_BY_SLUG = new Map<string, Category>(CATEGORIES.map((c) => [c.slug, c]));

export function isCategorySlug(value: string): value is CategorySlug {
  return CATEGORY_BY_SLUG.has(value);
}

export function getCategory(slug: string): Category | undefined {
  return CATEGORY_BY_SLUG.get(slug);
}

/* ── 文章 ─────────────────────────────────────────────── */

export interface Post {
  /** URL 末段，全站唯一 */
  slug: string;
  category: CategorySlug;
  title: string;
  /** <meta name="description"> */
  description: string;
  /** 列表卡片上的摘要，比 description 可以长一点 */
  excerpt: string;
  /** ISO 8601 日期，如 "2026-08-14" —— 页面可见，且进 Article JSON-LD */
  publishedAt: string;
  /** 同上。没改过就等于 publishedAt */
  updatedAt: string;
  readingMinutes: number;
  /** 精选位：/blog 首页会优先拿它 */
  featured?: boolean;
  /** 草稿不出现在任何列表与 sitemap 里 */
  draft?: boolean;
  /** 正文。接入 MDX 后这里放编译好的组件，模板直接 <Body /> */
  Body?: ComponentType;
}

/**
 * 文章仓库。
 * 现在是空的 —— 一篇都没写，页面走空态，绝不假装有内容。
 * 后续 SEO 流程往这里追加条目即可。
 */
const POSTS: Post[] = [];

/** 发表时间倒序；同一天的按标题稳定排序，避免构建产物抖动 */
function byNewest(a: Post, b: Post): number {
  if (a.publishedAt !== b.publishedAt) return a.publishedAt < b.publishedAt ? 1 : -1;
  return a.title.localeCompare(b.title);
}

function published(posts: Post[]): Post[] {
  return posts.filter((p) => !p.draft);
}

/** 全部已发布文章，新的在前 */
export async function getAllPosts(): Promise<Post[]> {
  return published(POSTS).sort(byNewest);
}

/** 某个分类下的已发布文章，新的在前。分类不存在时返回空数组 */
export async function getPostsByCategory(category: string): Promise<Post[]> {
  if (!isCategorySlug(category)) return [];
  return published(POSTS)
    .filter((p) => p.category === category)
    .sort(byNewest);
}

/** 单篇文章。分类与 slug 必须同时对得上，否则视为不存在 */
export async function getPost(category: string, slug: string): Promise<Post | null> {
  const post = POSTS.find((p) => p.category === category && p.slug === slug);
  if (!post || post.draft) return null;
  return post;
}

/** 精选位：优先取标了 featured 的，不够就用最新的补齐 */
export async function getFeaturedPosts(limit = 3): Promise<Post[]> {
  const all = await getAllPosts();
  const picked = all.filter((p) => p.featured);
  const rest = all.filter((p) => !p.featured);
  return [...picked, ...rest].slice(0, limit);
}

/** 同分类内的上一篇 / 下一篇，用于文章底部导航 */
export async function getAdjacentPosts(
  post: Post,
): Promise<{ prev: Post | null; next: Post | null }> {
  const siblings = await getPostsByCategory(post.category);
  const i = siblings.findIndex((p) => p.slug === post.slug);
  if (i === -1) return { prev: null, next: null };
  // siblings 是新→旧，所以「上一篇」是更早的那个
  return {
    prev: siblings[i + 1] ?? null,
    next: siblings[i - 1] ?? null,
  };
}

/* ── 路径与格式化 ─────────────────────────────────────── */

export function categoryHref(category: Pick<Category, "slug"> | CategorySlug): string {
  const slug = typeof category === "string" ? category : category.slug;
  return `/blog/${slug}`;
}

export function postHref(post: Pick<Post, "category" | "slug">): string {
  return `/blog/${post.category}/${post.slug}`;
}

/**
 * 可见日期。固定 en-US + UTC，保证服务端与客户端渲染结果一致，
 * 不会因为读者所在时区不同而出现 hydration 不匹配。
 */
export function formatPostDate(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

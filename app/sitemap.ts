/**
 * 站点地图 —— 只收录「任何人都可以看」的页面。
 *
 * 明确排除:
 *   /p/**   单个餐厅的设计稿预览，只发给那一家店，属于私下内容
 *   /d/**   同上
 *   /api/** 不是页面
 *   /admin  内部
 *   /unsubscribe 一次性动作页，无索引价值
 *
 * lastModified 统一取构建时间：内容随部署一起更新，
 * 每次构建给出同一个时间戳，避免同一份构建产物里出现互相不一致的日期。
 */

import type { MetadataRoute } from "next";
import { CATEGORIES, SITE_URL, categoryHref } from "@/lib/blog";

/** 模块求值发生在构建期，所以这就是构建时间 */
const BUILT_AT = new Date();

type Entry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

/** 公开页。顺序即重要性，读起来也像一张站点结构图 */
const PAGES: Entry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.9 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.9 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
  { path: "/about", changeFrequency: "yearly", priority: 0.6 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.6 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/refunds", changeFrequency: "yearly", priority: 0.3 },
];

function absolute(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = PAGES.map((p) => ({
    url: absolute(p.path),
    lastModified: BUILT_AT,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  // 四个分类枢纽页，从 lib/blog.ts 生成 —— 加分类只改一处
  const categories: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: absolute(categoryHref(c)),
    lastModified: BUILT_AT,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...pages, ...categories];
}

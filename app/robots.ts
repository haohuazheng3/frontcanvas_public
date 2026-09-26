/**
 * robots.txt
 *
 * 上线前（NEXT_PUBLIC_INDEXABLE 不为 "1"）整站 disallow —— 预览域名、
 * staging、还没准备好的正式站都不该进索引。这与 layout.tsx 里的
 * robots meta 用的是同一个开关，两边永远一致。
 *
 * 上线后放行全站，但仍然挡住：
 *   /p/  /d/  单个餐厅的设计稿，只发给那一家店看，不是公开内容
 *   /api/       不是页面
 *   /admin      内部
 *
 * 注意：robots.txt 只是「不要抓」，不等于「不要索引」。真正兜底的是
 * /p/ 与 /d/ 页面自己的 noindex meta。
 */

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/blog";

const INDEXABLE = process.env.NEXT_PUBLIC_INDEXABLE === "1";

export default function robots(): MetadataRoute.Robots {
  if (!INDEXABLE) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/p/", "/d/", "/api/", "/admin"],
      },
    ],
    sitemap: "https://frontcanvas.com/sitemap.xml",
    host: SITE_URL,
  };
}

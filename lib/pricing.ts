/**
 * 报价 —— 全站唯一真相源。
 * 页面、Stripe 商品、外联邮件都从这里读，改一处即处处改。
 *
 * 2026-09-10 调价：Launch 890→690、Complete 1600→1290（Care 不变）。
 * 理由：冷邮件成交的决策金额是 50% 定金，$345 / $645 都落在
 * 「老板一个人当场拍板」区间；$1,290 守住 $1,500 心理线，
 * 且 Launch→Complete 的 $600 价差正好等于一个月的外卖平台佣金。
 * 改价时 Stripe 里要同步建新 Price（lookupKey 版本号 +1）并停用旧的 ——
 * Checkout 扣的是 Stripe Price 的金额，不是这里的数字。
 */

export type TierId = "launch" | "complete" | "care";

export interface Tier {
  id: TierId;
  name: string;
  tagline: string;
  amountCents: number;
  /** 定期计费周期；一次性为 null */
  interval: "month" | null;
  blurb: string;
  includes: string[];
  featured?: boolean;
  /** Stripe 侧的稳定查找键 */
  lookupKey: string;
}

export const TIERS: Tier[] = [
  {
    id: "launch",
    name: "Launch",
    tagline: "The whole site, designed and live",
    amountCents: 69000,
    interval: null,
    lookupKey: "fc_launch_v2",
    blurb:
      "We turn the concept you already saw into a real, finished website — built, tested on every phone, and live on your own domain.",
    includes: [
      "Every page built out from the concept",
      "Menu, hours, location, photo gallery",
      "Works properly on phones — where most of your customers actually are",
      "Click-to-call, directions, and Google Maps wired up",
      "Your own domain, SSL, and fast hosting for the first year",
      "Google Business Profile and search basics set up",
      "Two rounds of revisions",
      "Live in about two weeks",
    ],
  },
  {
    id: "complete",
    name: "Complete",
    tagline: "Everything in Launch, plus taking orders",
    amountCents: 129000,
    interval: null,
    featured: true,
    lookupKey: "fc_complete_v2",
    blurb:
      "For restaurants that want the website to actually do work — take reservations, push online orders, and stop paying a third party for every cover.",
    includes: [
      "Everything in Launch",
      "Online ordering connected to your existing system",
      "Reservation and waitlist booking",
      "Email list capture and a simple newsletter setup",
      "Events and private-dining enquiry forms",
      "Multi-location support if you have more than one room",
      "Analytics so you can see what people actually click",
      "Three rounds of revisions",
    ],
  },
  {
    id: "care",
    name: "Care",
    tagline: "We keep it alive",
    amountCents: 8900,
    interval: "month",
    lookupKey: "fc_care_v1",
    blurb:
      "Menus change, prices change, holidays happen. Send us the edit and it is done the same week — no dashboards to learn.",
    includes: [
      "Unlimited content edits — menus, hours, prices, photos",
      "Hosting, domain, SSL, and backups",
      "Security patches and uptime monitoring",
      "Seasonal design refreshes",
      "A monthly note on how the site is doing",
      "Cancel any time",
    ],
  },
];

export const TIER_BY_ID = Object.fromEntries(TIERS.map((t) => [t.id, t])) as Record<TierId, Tier>;

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

/** 定金比例 —— 下单先付一半，交付上线付尾款 */
export const DEPOSIT_RATIO = 0.5;

export function depositCents(tier: Tier): number {
  return tier.interval ? tier.amountCents : Math.round(tier.amountCents * DEPOSIT_RATIO);
}

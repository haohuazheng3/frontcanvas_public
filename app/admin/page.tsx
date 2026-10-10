import type { Metadata } from "next";

import { sql } from "@/lib/db";
import {
  ADMIN_ROBOTS,
  STATUS_ORDER,
  STATUS_TONE,
  fmtAgo,
  fmtDuration,
  fmtInt,
  fmtWhen,
  getAdminSession,
  parseJson,
  shortValue,
  type SearchParams,
} from "@/lib/admin";
import { Badge, Card, EmptyState } from "@/components/ui";
import { TIER_BY_ID, formatPrice } from "@/lib/pricing";
import { AdminHeader, AdminNotice } from "./nav";
import { ContactedButton } from "./contacted-button";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Overview",
  robots: ADMIN_ROBOTS,
};

/* ── 数据 ─────────────────────────────────────────────────────── */

interface Overview {
  leadsTotal: number;
  leadsToday: number;
  byStatus: { status: string; n: number }[];
  sent: number;
  sentToday: number;
  queued: number;
  failed: number;
  replied: number;
  designs: number;
  viewed: number;
  interested: number;
  interestedOpen: number;
  repliedOpen: number;
  suppressed: number;
  unsubscribed: number;
  openErrors: number;
  fatalErrors: number;
  crons: CronRow[];
}

interface CronRow {
  id: string;
  job: string;
  started_at: unknown;
  finished_at: unknown;
  ok: boolean | null;
  stats: unknown;
}

async function loadOverview(): Promise<Overview | null> {
  try {
    const [leads, statuses, mail, designs, supp, errs, crons, heat] = await Promise.all([
      // 全后台只统计入选的目标客户 —— 被淘汰的（skipped/dead）对站长不存在
      sql`
        SELECT count(*)::int AS total,
               (count(*) FILTER (WHERE discovered_at >= date_trunc('day', now())))::int AS today
        FROM leads WHERE status NOT IN ('skipped','dead')
      `,
      sql`SELECT status, count(*)::int AS n FROM leads
          WHERE status NOT IN ('skipped','dead') GROUP BY status`,
      sql`
        SELECT (count(*) FILTER (WHERE sent_at IS NOT NULL))::int AS sent,
               (count(*) FILTER (WHERE sent_at >= date_trunc('day', now())))::int AS sent_today,
               (count(*) FILTER (WHERE status = 'queued'))::int AS queued,
               (count(*) FILTER (WHERE status IN ('failed','bounced','complained')))::int AS failed,
               (count(*) FILTER (WHERE status = 'replied'))::int AS replied
        FROM outreach
      `,
      sql`SELECT count(*)::int AS n FROM designs`,
      sql`
        SELECT count(*)::int AS total,
               (count(*) FILTER (WHERE reason = 'unsubscribe'))::int AS unsub
        FROM suppression
      `,
      sql`
        SELECT count(*)::int AS open_count,
               (count(*) FILTER (WHERE severity = 'fatal'))::int AS fatal
        FROM errors WHERE resolved = false
      `,
      sql`
        SELECT id, job, started_at, finished_at, ok, stats
        FROM cron_runs ORDER BY started_at DESC LIMIT 5
      `,
      sql`
        SELECT (SELECT count(*)::int FROM designs d JOIN leads l ON l.id = d.lead_id
                 WHERE d.first_viewed_at IS NOT NULL AND l.status NOT IN ('skipped','dead')) AS viewed,
               (SELECT count(DISTINCT lead_id)::int FROM interests) AS interested,
               (SELECT count(DISTINCT lead_id)::int FROM interests WHERE handled = false) AS interested_open,
               (SELECT count(DISTINCT lead_id)::int FROM replies WHERE auto = false) AS replied_leads,
               (SELECT count(DISTINCT lead_id)::int FROM replies WHERE auto = false AND handled = false) AS replied_open
      `,
    ]);

    const l = (leads as { total: number; today: number }[])[0];
    const m = (mail as {
      sent: number;
      sent_today: number;
      queued: number;
      failed: number;
      replied: number;
    }[])[0];
    const s = (supp as { total: number; unsub: number }[])[0];
    const e = (errs as { open_count: number; fatal: number }[])[0];
    const h = (heat as {
      viewed: number;
      interested: number;
      interested_open: number;
      replied_leads: number;
      replied_open: number;
    }[])[0];

    return {
      leadsTotal: l?.total ?? 0,
      leadsToday: l?.today ?? 0,
      byStatus: sortStatuses(statuses as { status: string; n: number }[]),
      sent: m?.sent ?? 0,
      sentToday: m?.sent_today ?? 0,
      queued: m?.queued ?? 0,
      failed: m?.failed ?? 0,
      // 真人回信的商家数（replies 表，自动回复不算）；外联表的 replied 状态只是它的影子
      replied: h?.replied_leads ?? m?.replied ?? 0,
      designs: (designs as { n: number }[])[0]?.n ?? 0,
      viewed: h?.viewed ?? 0,
      interested: h?.interested ?? 0,
      interestedOpen: h?.interested_open ?? 0,
      repliedOpen: h?.replied_open ?? 0,
      suppressed: s?.total ?? 0,
      unsubscribed: s?.unsub ?? 0,
      openErrors: e?.open_count ?? 0,
      fatalErrors: e?.fatal ?? 0,
      crons: crons as CronRow[],
    };
  } catch (err) {
    console.error("[/admin] overview query failed", err);
    return null;
  }
}

/* ── 商家账本：站长每天真正想看的那张表 ─────────────────────── */

interface LedgerRow {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  socials: unknown;
  status: string;
  skip_reason: string | null;
  discovered_at: unknown;
  badness: number | null;
  design_slug: string | null;
  views: number | null;
  last_viewed_at: unknown;
  opened_design: boolean;
  email_sent_at: unknown;
  email_status: string | null;
  followup_sent_at: unknown;
  replied: boolean;
}

async function loadLedger(): Promise<LedgerRow[]> {
  try {
    const rows = await sql`
      SELECT l.id, l.name, l.slug, l.city, l.address, l.website, l.email, l.phone,
             l.socials, l.status, l.skip_reason, l.discovered_at,
             a.badness,
             d.slug AS design_slug, d.views, d.last_viewed_at,
             EXISTS (SELECT 1 FROM design_views v WHERE v.lead_id = l.id AND v.page = 'd') AS opened_design,
             o.sent_at AS email_sent_at, o.status AS email_status,
             fu.sent_at AS followup_sent_at,
             EXISTS (SELECT 1 FROM replies r WHERE r.lead_id = l.id AND r.auto = false) AS replied
      FROM leads l
      LEFT JOIN LATERAL (
        SELECT badness FROM audits WHERE lead_id = l.id ORDER BY audited_at DESC LIMIT 1
      ) a ON true
      LEFT JOIN LATERAL (
        SELECT slug, views, last_viewed_at FROM designs WHERE lead_id = l.id ORDER BY built_at DESC LIMIT 1
      ) d ON true
      LEFT JOIN LATERAL (
        SELECT sent_at, status FROM outreach
        WHERE lead_id = l.id AND channel = 'email' AND kind = 'first'
        ORDER BY queued_at DESC LIMIT 1
      ) o ON true
      LEFT JOIN LATERAL (
        SELECT sent_at FROM outreach
        WHERE lead_id = l.id AND kind = 'followup' AND sent_at IS NOT NULL
        ORDER BY sent_at DESC LIMIT 1
      ) fu ON true
      -- 账本只列入选的目标客户。发现期终审淘汰的（原站体面/连锁店/归属存疑）
      -- 留在库里只为去重，不给站长看 —— 它们不是客户，是噪音。
      WHERE l.status NOT IN ('skipped','dead')
      ORDER BY l.discovered_at DESC
      LIMIT 60`;
    return rows as LedgerRow[];
  } catch (err) {
    console.error("[/admin] ledger query failed", err);
    return [];
  }
}

/* ── 热线索：说了想要的、看过稿子的 —— 站长今天该打的电话 ───── */

interface HotRow {
  id: string;
  name: string;
  city: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  slug: string;
  views: number | null;
  first_viewed_at: unknown;
  last_viewed_at: unknown;
  opened_design: boolean;
  last_device: string | null;
  last_city: string | null;
  first_sent_at: unknown;
  first_status: string | null;
  followup_sent_at: unknown;
  i_contact: string | null;
  i_method: string | null;
  i_tier: string | null;
  i_name: string | null;
  i_message: string | null;
  i_at: unknown;
  i_handled: boolean | null;
  r_body: string | null;
  r_from: string | null;
  r_at: unknown;
  r_folder: string | null;
  r_opt_out: boolean | null;
  r_handled: boolean | null;
  reply_count: number;
}

async function loadHot(): Promise<HotRow[]> {
  try {
    const rows = await sql`
      SELECT l.id, l.name, l.city, l.phone, l.email, l.status,
             d.slug, d.views, d.first_viewed_at, d.last_viewed_at,
             EXISTS (SELECT 1 FROM design_views v WHERE v.lead_id = l.id AND v.page = 'd') AS opened_design,
             lv.device AS last_device, lv.city AS last_city,
             fo.sent_at AS first_sent_at, fo.status AS first_status,
             fu.sent_at AS followup_sent_at,
             i.contact AS i_contact, i.method AS i_method, i.tier AS i_tier,
             i.name AS i_name, i.message AS i_message, i.created_at AS i_at, i.handled AS i_handled,
             rp.body AS r_body, rp.from_email AS r_from, rp.received_at AS r_at, rp.folder AS r_folder,
             rp.opt_out AS r_opt_out, rp.handled AS r_handled,
             (SELECT count(*)::int FROM replies r2 WHERE r2.lead_id = l.id AND r2.auto = false) AS reply_count
      FROM leads l
      JOIN LATERAL (
        SELECT slug, views, first_viewed_at, last_viewed_at FROM designs
        WHERE lead_id = l.id ORDER BY built_at DESC LIMIT 1
      ) d ON true
      LEFT JOIN LATERAL (
        SELECT device, city FROM design_views WHERE lead_id = l.id ORDER BY created_at DESC LIMIT 1
      ) lv ON true
      LEFT JOIN LATERAL (
        SELECT sent_at, status FROM outreach
        WHERE lead_id = l.id AND channel = 'email' AND kind = 'first'
        ORDER BY queued_at ASC LIMIT 1
      ) fo ON true
      LEFT JOIN LATERAL (
        SELECT sent_at FROM outreach
        WHERE lead_id = l.id AND kind = 'followup' AND sent_at IS NOT NULL
        ORDER BY sent_at DESC LIMIT 1
      ) fu ON true
      LEFT JOIN LATERAL (
        SELECT contact, method, tier, name, message, created_at, handled FROM interests
        WHERE lead_id = l.id ORDER BY created_at DESC LIMIT 1
      ) i ON true
      LEFT JOIN LATERAL (
        SELECT body, from_email, received_at, folder, opt_out, handled FROM replies
        WHERE lead_id = l.id AND auto = false ORDER BY received_at DESC LIMIT 1
      ) rp ON true
      WHERE l.status NOT IN ('skipped','dead')
        AND (d.first_viewed_at IS NOT NULL OR i.created_at IS NOT NULL OR rp.received_at IS NOT NULL)
      -- 等你处理的（没处理的意向、没处理的回信）最前；已联系 / 已成交的沉底；其余按最近动静排
      ORDER BY ((i.created_at IS NOT NULL AND i.handled = false)
                OR (rp.received_at IS NOT NULL AND rp.handled = false)) DESC,
               (l.status IN ('replied','won')) ASC,
               GREATEST(i.created_at, d.last_viewed_at, rp.received_at) DESC NULLS LAST
      LIMIT 40`;
    return rows as HotRow[];
  } catch (err) {
    // design_views / interests 可能还没迁移 —— 这一节空着，整页照常
    console.error("[/admin] hot leads query failed", err);
    return [];
  }
}

/** 按发现日分组（本地日期字符串） */
function groupByDay(rows: LedgerRow[]): [string, LedgerRow[]][] {
  const map = new Map<string, LedgerRow[]>();
  for (const r of rows) {
    const d = r.discovered_at ? new Date(String(r.discovered_at)) : null;
    const key = d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : "unknown";
    (map.get(key) ?? map.set(key, []).get(key)!).push(r);
  }
  return [...map.entries()];
}

/* ── 收件箱日报（09:00 任务写 digests 表）───────────────────── */

interface DigestRow {
  day: string;
  body: string;
}

async function loadDigests(): Promise<DigestRow[]> {
  try {
    const rows = await sql`SELECT day::text, body FROM digests ORDER BY day DESC LIMIT 7`;
    return rows as DigestRow[];
  } catch (err) {
    // digests 表可能还没迁移出来 —— 页面照常渲染，这一节显示空态即可
    console.error("[/admin] digests query failed", err);
    return [];
  }
}

function sortStatuses(rows: { status: string; n: number }[]): { status: string; n: number }[] {
  const rank = (s: string) => {
    const i = (STATUS_ORDER as readonly string[]).indexOf(s);
    return i === -1 ? STATUS_ORDER.length : i;
  };
  return [...rows].sort((a, b) => rank(a.status ?? "") - rank(b.status ?? ""));
}

/* ── 零件 ─────────────────────────────────────────────────────── */

function Stat({
  label,
  value,
  hint,
  tone = "ink",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "ink" | "accent" | "ok" | "warn" | "bad";
}) {
  const color = {
    ink: "text-ink",
    accent: "text-accent",
    ok: "text-ok",
    warn: "text-warn",
    bad: "text-bad",
  }[tone];

  return (
    <Card size="sm" className="p-5">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.11em] text-ink-3">{label}</p>
      <p className={`display mt-2.5 text-[1.9rem] leading-none ${color}`}>{value}</p>
      <p className="mt-2 min-h-[1.1rem] text-[0.78rem] leading-tight text-ink-3">{hint ?? ""}</p>
    </Card>
  );
}

function PipelineRow({ status, n, max }: { status: string; n: number; max: number }) {
  const pct = max > 0 ? Math.max(3, Math.round((n / max) * 100)) : 0;
  return (
    <li className="flex items-center gap-3">
      <span className="min-w-[5.5rem] shrink-0">
        <Badge tone={STATUS_TONE[status] ?? "neutral"}>{status || "unknown"}</Badge>
      </span>
      <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-[var(--r-full)] bg-surface-inset">
        <span
          className="block h-full rounded-[var(--r-full)] bg-accent-soft"
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="w-12 shrink-0 text-right font-mono text-[0.85rem] text-ink">
        {fmtInt(n)}
      </span>
    </li>
  );
}

function CronCard({ run }: { run: CronRow }) {
  const stats = parseJson(run.stats);
  const entries = stats ? Object.entries(stats).slice(0, 8) : [];
  const running = run.ok === null && !run.finished_at;

  return (
    <Card as="li" size="sm" className="p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-mono text-[0.9rem] font-semibold text-ink">{run.job}</span>
        {running ? (
          <Badge tone="warn">running</Badge>
        ) : run.ok ? (
          <Badge tone="ok">ok</Badge>
        ) : (
          <Badge tone="bad">failed</Badge>
        )}
        <span className="text-[0.8rem] text-ink-3">
          {fmtWhen(run.started_at)} · {fmtAgo(run.started_at)} · took{" "}
          {fmtDuration(run.started_at, run.finished_at)}
        </span>
      </div>

      {entries.length > 0 ? (
        <ul className="mt-3.5 flex flex-wrap gap-2">
          {entries.map(([k, v]) => (
            <li
              key={k}
              className="rounded-[var(--r-full)] bg-surface-inset px-3 py-1 font-mono text-[0.75rem] text-ink-2"
            >
              {k} <span className="font-semibold text-ink">{shortValue(v)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[0.8rem] text-ink-3">No stats recorded for this run.</p>
      )}
    </Card>
  );
}

/** 账本里的一行商家 */
function LedgerTr({ row }: { row: LedgerRow }) {
  const socials = (parseJson(row.socials) ?? {}) as Record<string, unknown>;
  const fb = typeof socials.facebook === "string" ? socials.facebook : null;
  const ig = typeof socials.instagram === "string" ? socials.instagram : null;

  let host: string | null = null;
  if (row.website) {
    try { host = new URL(row.website).hostname.replace(/^www\./, ""); } catch { host = row.website; }
  }

  const designCell = row.design_slug ? (
    <span className="flex flex-wrap gap-x-2.5 gap-y-1">
      <a href={`/d/${row.design_slug}`} target="_blank" rel="noopener" className="font-semibold text-ok hover:underline">✅ 成品</a>
      <a href={`/p/${row.design_slug}`} target="_blank" rel="noopener" className="text-ink-2 hover:underline">介绍页</a>
    </span>
  ) : row.status === "skipped" ? (
    <span className="text-warn">✕ {row.skip_reason ?? "不做"}</span>
  ) : (
    <span className="text-ink-3">—</span>
  );

  const viewCell =
    row.views && row.views > 0 ? (
      <span className="flex flex-col gap-0.5">
        <span className="font-semibold text-accent">👀 {row.views} 次</span>
        <span className="text-[0.78rem] text-ink-3">
          最近 {fmtAgo(row.last_viewed_at)}
          {row.opened_design ? " · 看了成品" : ""}
        </span>
      </span>
    ) : row.email_sent_at && row.email_status === "sent" ? (
      <span className="text-ink-3">没打开</span>
    ) : (
      <span className="text-ink-3">—</span>
    );

  const emailCell = row.replied ? (
    <span className="font-semibold text-accent">💬 回信了</span>
  ) : row.email_status === "bounced" ? (
    <span className="text-bad">✕ 退信（地址失效）</span>
  ) : row.email_status === "unsubscribed" ? (
    <span className="text-warn">✕ 已退订</span>
  ) : row.email_sent_at ? (
    <span className="flex flex-col gap-0.5">
      <span className="text-ok">✅ {fmtWhen(row.email_sent_at)}</span>
      {row.followup_sent_at ? (
        <span className="text-[0.78rem] text-ink-2">↪ 跟进 {fmtWhen(row.followup_sent_at)}</span>
      ) : null}
    </span>
  ) : row.email_status === "failed" ? (
    <span className="text-bad">✕ 发送失败</span>
  ) : !row.email ? (
    <span className="text-ink-3">✕ 无邮箱</span>
  ) : (
    <span className="text-ink-3">—</span>
  );

  return (
    <tr className="border-t border-line align-top">
      <td className="py-3 pr-4">
        <p className="font-semibold text-ink">{row.name}</p>
        <p className="mt-0.5 text-[0.78rem] text-ink-3">
          {[row.city, row.address].filter(Boolean).join(" · ") || "—"}
          {typeof row.badness === "number" ? ` · badness ${row.badness}` : ""}
        </p>
      </td>
      <td className="py-3 pr-4">
        {row.website && host ? (
          <a href={row.website} target="_blank" rel="noopener" className="text-ink-2 hover:underline">{host}</a>
        ) : (
          <span className="text-ink-3">—</span>
        )}
      </td>
      <td className="py-3 pr-4">
        <ul className="space-y-1 text-[0.82rem] text-ink-2">
          {row.email ? <li>📧 {row.email}</li> : null}
          {row.phone ? <li>📞 {row.phone}</li> : null}
          {fb ? <li>📘 <a href={fb} target="_blank" rel="noopener" className="hover:underline">Facebook</a></li> : null}
          {ig ? <li>📷 <a href={ig} target="_blank" rel="noopener" className="hover:underline">Instagram</a></li> : null}
          {!row.email && !row.phone && !fb && !ig ? <li className="text-ink-3">—</li> : null}
        </ul>
      </td>
      <td className="py-3 pr-4">{designCell}</td>
      <td className="py-3 pr-4">{emailCell}</td>
      <td className="py-3">{viewCell}</td>
    </tr>
  );
}

/* ── 热线索卡片 ───────────────────────────────────────────────── */

/** 与 ops/followup.mjs 的 AFTER_DAYS 保持一致 */
const FOLLOWUP_AFTER_DAYS = 5;

const METHOD_ZH: Record<string, string> = { call: "打电话", text: "发短信", email: "发邮件" };

function tierZh(tier: string | null): string {
  if (tier === "launch") return `Launch ${formatPrice(TIER_BY_ID.launch.amountCents)}`;
  if (tier === "complete") return `Complete ${formatPrice(TIER_BY_ID.complete.amountCents)}（含在线点餐）`;
  return "还没想好";
}

function deviceZh(device: string | null): string {
  const d = (device ?? "").toLowerCase();
  if (d.includes("mobile") || d.includes("phone")) return "手机";
  if (d.includes("desktop")) return "电脑";
  if (d.includes("tablet")) return "平板";
  return device ?? "";
}

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** 联系方式可能是邮箱也可能是电话 —— 各给一个点了就能用的链接 */
function ContactLink({ value }: { value: string | null }) {
  if (!value) return <span className="text-ink-3">—</span>;
  const href = value.includes("@") ? `mailto:${value}` : telHref(value);
  return (
    <a href={href} className="font-semibold text-accent hover:underline">
      {value}
    </a>
  );
}

/** 这家的跟进邮件会不会发、什么时候发 */
function followupNote(r: HotRow): string {
  if (r.followup_sent_at) return `已发（${fmtWhen(r.followup_sent_at)}）`;
  if (r.r_at) return r.r_opt_out ? "不发 —— 他们回信要求别再发" : "不发 —— 他们回信了，等你回复";
  if (r.i_at && !r.i_handled) return "不发 —— 他们已经留了联系方式，等你联系";
  if (r.status === "interested") return "不发 —— 他们已经表达了意向";
  if (r.status === "replied" || r.status === "won") return "不发 —— 已联系";
  if (r.first_status === "bounced") return "不发 —— 首封退信";
  if (r.first_status === "unsubscribed") return "不发 —— 已退订";
  if (r.first_status === "replied") return "不发 —— 已回复邮件";
  if (!r.first_sent_at || r.first_status !== "sent") return "不发 —— 首封还没送达";
  const due = new Date(String(r.first_sent_at)).getTime() + FOLLOWUP_AFTER_DAYS * 86_400_000;
  if (due <= Date.now()) return "下一次外联任务（每天 07:00）自动发出";
  return `${new Date(due).toISOString().slice(0, 10)} 起的外联任务自动发出`;
}

function HotCard({ row, adminKey }: { row: HotRow; adminKey: string | null }) {
  const wants = Boolean(row.i_at);
  // 商家一回信 status 就自动变 replied —— 那不等于你联系过了。只要还有没处理的回信或意向，就是在等你
  const waiting = (Boolean(row.r_at) && !row.r_handled) || (wants && !row.i_handled);
  const contacted = !waiting && (row.status === "replied" || row.status === "won");
  const where = [deviceZh(row.last_device), row.last_city].filter(Boolean).join(" · ");

  return (
    <li className="rounded-[var(--r-lg)] bg-surface-inset p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="font-semibold text-ink">{row.name}</p>
        {wants && !row.i_handled ? <Badge tone="accent">🔥 说想要</Badge> : null}
        {row.r_at && !row.r_handled ? (
          <Badge tone={row.r_opt_out ? "warn" : "accent"}>{row.r_opt_out ? "🚫 要求别再发" : "💬 回信了"}</Badge>
        ) : null}
        <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>{row.status}</Badge>
        {row.city ? <span className="text-[0.8rem] text-ink-3">{row.city}</span> : null}
      </div>

      {row.r_at ? (
        <div className="mt-3 rounded-[var(--r-md)] bg-surface p-4 text-[0.86rem] leading-relaxed text-ink-2">
          <p>
            <span className="font-semibold text-ink">{fmtAgo(row.r_at)}</span> 回了邮件（{row.r_from}）
            {row.reply_count > 1 ? ` · 一共 ${row.reply_count} 封` : ""}
            {row.r_folder && row.r_folder !== "INBOX" ? " · 在垃圾邮件箱里找到的" : ""}
          </p>
          <p className="mt-1.5 whitespace-pre-wrap text-ink">
            {row.r_body || "（正文是空的，可能只发了图片或附件，去 hello@ 收件箱看原信）"}
          </p>
          {!row.r_handled ? (
            <p className="mt-2 text-[0.78rem] text-ink-3">
              {row.r_opt_out
                ? "已加进抑制列表，不会再给这家发任何邮件。"
                : "去 hello@ 收件箱直接回复那封信（会接在原邮件串里），回完点下面「标记为已联系」。"}
            </p>
          ) : null}
        </div>
      ) : null}

      {wants ? (
        <div className="mt-3 rounded-[var(--r-md)] bg-surface p-4 text-[0.86rem] leading-relaxed text-ink-2">
          <p>
            <span className="font-semibold text-ink">{fmtAgo(row.i_at)}</span> 在介绍页留了联系方式：
            <ContactLink value={row.i_contact} />
            {row.i_method ? `（希望${METHOD_ZH[row.i_method] ?? row.i_method}）` : ""}
          </p>
          <p>
            方案倾向：{tierZh(row.i_tier)}
            {row.i_name ? ` · 称呼：${row.i_name}` : ""}
          </p>
          {row.i_message ? <p className="mt-1.5 text-ink">“{row.i_message}”</p> : null}
        </div>
      ) : null}

      <ul className="mt-3 space-y-1 text-[0.84rem] text-ink-2">
        <li>
          📞{" "}
          {row.phone ? (
            <a href={telHref(row.phone)} className="font-semibold text-accent hover:underline">
              {row.phone}
            </a>
          ) : (
            <span className="text-ink-3">没有电话</span>
          )}
          {row.email ? <span className="text-ink-3"> · 📧 {row.email}</span> : null}
        </li>
        {row.first_viewed_at ? (
          <li>
            👀 看过 {fmtInt(row.views ?? 0)} 次 · 首次 {fmtWhen(row.first_viewed_at)} · 最近{" "}
            {fmtAgo(row.last_viewed_at)}
            {where ? ` · ${where}` : ""}
          </li>
        ) : null}
        {row.first_viewed_at ? (
          <li>{row.opened_design ? "✅ 点开了成品稿" : "只看了介绍页，没点开成品稿"}</li>
        ) : null}
        <li>↪ 跟进邮件：{followupNote(row)}</li>
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <a href={`/p/${row.slug}`} target="_blank" rel="noopener" className="text-[0.84rem] text-ink-2 hover:underline">
          介绍页
        </a>
        <a href={`/d/${row.slug}`} target="_blank" rel="noopener" className="text-[0.84rem] text-ink-2 hover:underline">
          成品稿
        </a>
        {contacted ? (
          <span className="text-[0.8rem] font-semibold text-ok">已联系 · 不再自动跟进</span>
        ) : (
          <ContactedButton leadId={row.id} adminKey={adminKey} />
        )}
      </div>
    </li>
  );
}

/* ── 页面 ─────────────────────────────────────────────────────── */

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getAdminSession(searchParams);

  // 没有会话 → 登录页。整页只有一个口令框，不带任何数据。
  if (!session) {
    return (
      <div className="grid min-h-[70svh] place-items-center px-5 pb-20">
        <Card className="w-full max-w-[26rem] p-8 md:p-10">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-accent">
            Control room
          </p>
          <h1 className="display mt-2.5 text-[1.9rem] leading-[1.08] text-ink">后台</h1>
          <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-2">
            输入口令进入。这里能看到流水线找到的每一家商家、设计稿、外联进度和收件箱日报。
          </p>
          <LoginForm />
        </Card>
      </div>
    );
  }

  const [data, ledger, digests, hot] = await Promise.all([
    loadOverview(),
    loadLedger(),
    loadDigests(),
    loadHot(),
  ]);

  const maxStatus = data ? Math.max(1, ...data.byStatus.map((r) => r.n)) : 1;

  return (
    <div className="pb-20">
      <AdminHeader
        session={session}
        active="/admin"
        title="Overview"
        sub="Everything the pipeline did, and everything it broke. Numbers are live off the database on every load — nothing here is cached."
      />

      <section className="shell">
        {!data ? (
          <AdminNotice>
            The overview queries failed. Check DATABASE_URL and whether db/schema.sql has been
            applied to this branch.
          </AdminNotice>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4 md:gap-5">
              <Stat
                label="Leads today"
                value={fmtInt(data.leadsToday)}
                hint="Discovered since 00:00 UTC"
                tone="accent"
              />
              <Stat
                label="Leads total"
                value={fmtInt(data.leadsTotal)}
                hint={`${fmtInt(data.designs)} have a concept built`}
              />
              <Stat
                label="Emails sent"
                value={fmtInt(data.sent)}
                hint={`${fmtInt(data.sentToday)} today · ${fmtInt(data.queued)} queued`}
              />
              <Stat
                label="Viewed concept"
                value={fmtInt(data.viewed)}
                hint="Opened the link and stayed 2s+"
                tone={data.viewed > 0 ? "accent" : "ink"}
              />
              <Stat
                label="Want it"
                value={fmtInt(data.interested)}
                hint={
                  data.interestedOpen > 0
                    ? `${fmtInt(data.interestedOpen)} waiting for your call`
                    : "Nobody waiting on you"
                }
                tone={data.interestedOpen > 0 ? "accent" : data.interested > 0 ? "ok" : "ink"}
              />
              <Stat
                label="Replies"
                value={fmtInt(data.replied)}
                hint={
                  data.repliedOpen > 0
                    ? `${fmtInt(data.repliedOpen)} waiting for your answer`
                    : `Real people only · ${fmtInt(data.failed)} bounced or failed`
                }
                tone={data.repliedOpen > 0 ? "accent" : data.replied > 0 ? "ok" : "ink"}
              />
              <Stat
                label="Unsubscribes"
                value={fmtInt(data.unsubscribed)}
                hint={`${fmtInt(data.suppressed)} addresses suppressed in total`}
                tone={data.unsubscribed > 0 ? "warn" : "ink"}
              />
              <Stat
                label="Open errors"
                value={fmtInt(data.openErrors)}
                hint={
                  data.fatalErrors > 0
                    ? `${fmtInt(data.fatalErrors)} of them fatal`
                    : "Nothing fatal outstanding"
                }
                tone={data.openErrors > 0 ? "bad" : "ok"}
              />
            </div>

            {/* ── 热线索 ── */}
            <Card className="mt-6 p-6 md:mt-8 md:p-8">
              <h2 className="display text-[1.4rem] text-ink">🔥 热线索</h2>
              <p className="mt-1.5 text-[0.85rem] text-ink-3">
                回了邮件的、说了想要的排最前（回信原文就在卡片里），其次是看过稿子的
                （打开链接并停留 2 秒以上才算，邮件网关的预抓取不算）。
                有人回信、第一次打开或留了联系方式，都会发邮件提醒你；系统从不替你回信。
                回复或打完电话后点「标记为已联系」，这家就不会再收到自动跟进。
                看过稿子、首封满 {FOLLOWUP_AFTER_DAYS} 天还没回音的，外联任务会自动补发一封简短跟进，每家只发一次。
              </p>
              {hot.length === 0 ? (
                <p className="mt-6 text-[0.9rem] text-ink-2">
                  还没有人打开过稿子。有人看了，这里会第一时间出现。
                </p>
              ) : (
                <ul className="mt-5 space-y-3.5">
                  {hot.map((r) => (
                    <HotCard key={r.id} row={r} adminKey={session.key} />
                  ))}
                </ul>
              )}
            </Card>

            {/* ── 商家账本 ── */}
            <Card className="mt-6 p-6 md:mt-8 md:p-8">
              <h2 className="display text-[1.4rem] text-ink">商家账本</h2>
              <p className="mt-1.5 text-[0.85rem] text-ink-3">
                流水线找到的每一家：在哪、旧网站、联系方式、设计稿、邮件进度、有没有看过。按发现日分组，新的在上。
                Facebook / Instagram 只收集不发送。
              </p>
              {ledger.length === 0 ? (
                <p className="mt-6 text-[0.9rem] text-ink-2">
                  还没有商家。发现任务（每天 00:00）跑过之后，这里会出现当天的 5 家。
                </p>
              ) : (
                groupByDay(ledger).map(([day, rows]) => (
                  <div key={day} className="mt-6">
                    <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-ink-3">
                      {day} · {rows.length} 家
                    </p>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[64rem] border-collapse text-[0.85rem]">
                        <thead>
                          <tr className="text-left text-[0.72rem] uppercase tracking-[0.08em] text-ink-3">
                            <th className="pb-2.5 pr-4 font-semibold">商家</th>
                            <th className="pb-2.5 pr-4 font-semibold">旧网站</th>
                            <th className="pb-2.5 pr-4 font-semibold">联系方式</th>
                            <th className="pb-2.5 pr-4 font-semibold">设计稿</th>
                            <th className="pb-2.5 pr-4 font-semibold">邮件</th>
                            <th className="pb-2.5 font-semibold">看过</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r) => (
                            <LedgerTr key={r.id} row={r} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </Card>

            {/* ── 收件箱日报 ── */}
            <Card className="mt-6 p-6 md:mt-8 md:p-8">
              <h2 className="display text-[1.4rem] text-ink">收件箱日报</h2>
              <p className="mt-1.5 text-[0.85rem] text-ink-3">
                每天 09:00 的任务读 hello@ 收件箱后写在这里。没有商家来信的日子也会写明，沉默即异常。
              </p>
              {digests.length === 0 ? (
                <p className="mt-6 text-[0.9rem] text-ink-2">还没有日报。收件箱任务跑过之后出现。</p>
              ) : (
                <ul className="mt-5 space-y-4">
                  {digests.map((d) => (
                    <li key={d.day} className="rounded-[var(--r-lg)] bg-surface-inset p-5">
                      <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-accent">
                        {d.day}
                      </p>
                      <pre className="mt-2.5 whitespace-pre-wrap font-sans text-[0.88rem] leading-relaxed text-ink-2">
                        {d.body}
                      </pre>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="mt-6 p-6 md:mt-8 md:p-8">
              <h2 className="display text-[1.4rem] text-ink">Pipeline by status</h2>
              <p className="mt-1.5 text-[0.85rem] text-ink-3">
                Where every lead currently sits. Bars are relative to the largest bucket.
              </p>
              {data.byStatus.length > 0 ? (
                <ul className="mt-6 space-y-3">
                  {data.byStatus.map((row) => (
                    <PipelineRow
                      key={row.status ?? "unknown"}
                      status={row.status}
                      n={row.n}
                      max={maxStatus}
                    />
                  ))}
                </ul>
              ) : (
                <p className="mt-6 text-[0.9rem] text-ink-2">
                  No leads yet. Task A has not written anything.
                </p>
              )}
            </Card>

            <div className="mt-6 md:mt-8">
              <h2 className="display text-[1.4rem] text-ink">Last five cron runs</h2>
              <p className="mt-1.5 text-[0.85rem] text-ink-3">
                Newest first. A run with no finish time is either still going or died mid-flight.
              </p>
              {data.crons.length > 0 ? (
                <ul className="mt-5 space-y-3.5">
                  {data.crons.map((run) => (
                    <CronCard key={run.id} run={run} />
                  ))}
                </ul>
              ) : (
                <div className="mt-5">
                  <EmptyState
                    title="No cron runs logged"
                    body="Nothing has written to cron_runs yet. Once the schedulers fire, the last five land here."
                  />
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

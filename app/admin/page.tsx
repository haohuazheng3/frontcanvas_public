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
import { AdminHeader, AdminNotice } from "./nav";
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
    const [leads, statuses, mail, designs, supp, errs, crons] = await Promise.all([
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

    return {
      leadsTotal: l?.total ?? 0,
      leadsToday: l?.today ?? 0,
      byStatus: sortStatuses(statuses as { status: string; n: number }[]),
      sent: m?.sent ?? 0,
      sentToday: m?.sent_today ?? 0,
      queued: m?.queued ?? 0,
      failed: m?.failed ?? 0,
      replied: m?.replied ?? 0,
      designs: (designs as { n: number }[])[0]?.n ?? 0,
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
  email_sent_at: unknown;
  email_status: string | null;
}

async function loadLedger(): Promise<LedgerRow[]> {
  try {
    const rows = await sql`
      SELECT l.id, l.name, l.slug, l.city, l.address, l.website, l.email, l.phone,
             l.socials, l.status, l.skip_reason, l.discovered_at,
             a.badness,
             d.slug AS design_slug,
             o.sent_at AS email_sent_at, o.status AS email_status
      FROM leads l
      LEFT JOIN LATERAL (
        SELECT badness FROM audits WHERE lead_id = l.id ORDER BY audited_at DESC LIMIT 1
      ) a ON true
      LEFT JOIN LATERAL (
        SELECT slug FROM designs WHERE lead_id = l.id ORDER BY built_at DESC LIMIT 1
      ) d ON true
      LEFT JOIN LATERAL (
        SELECT sent_at, status FROM outreach
        WHERE lead_id = l.id AND channel = 'email'
        ORDER BY queued_at DESC LIMIT 1
      ) o ON true
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

  const emailCell = row.email_sent_at ? (
    <span className="text-ok">✅ {fmtWhen(row.email_sent_at)}</span>
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
      <td className="py-3">{emailCell}</td>
    </tr>
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

  const [data, ledger, digests] = await Promise.all([loadOverview(), loadLedger(), loadDigests()]);

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
            <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 md:gap-5">
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
                label="Replies"
                value={fmtInt(data.replied)}
                hint={`${fmtInt(data.failed)} failed, bounced or complained`}
                tone={data.replied > 0 ? "ok" : "ink"}
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

            {/* ── 商家账本 ── */}
            <Card className="mt-6 p-6 md:mt-8 md:p-8">
              <h2 className="display text-[1.4rem] text-ink">商家账本</h2>
              <p className="mt-1.5 text-[0.85rem] text-ink-3">
                流水线找到的每一家：在哪、旧网站、联系方式、设计稿、邮件进度。按发现日分组，新的在上。
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
                      <table className="w-full min-w-[56rem] border-collapse text-[0.85rem]">
                        <thead>
                          <tr className="text-left text-[0.72rem] uppercase tracking-[0.08em] text-ink-3">
                            <th className="pb-2.5 pr-4 font-semibold">商家</th>
                            <th className="pb-2.5 pr-4 font-semibold">旧网站</th>
                            <th className="pb-2.5 pr-4 font-semibold">联系方式</th>
                            <th className="pb-2.5 pr-4 font-semibold">设计稿</th>
                            <th className="pb-2.5 font-semibold">邮件</th>
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

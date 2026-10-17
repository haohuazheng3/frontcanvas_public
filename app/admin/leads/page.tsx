import type { Metadata } from "next";
import type { ReactNode } from "react";

import { sql } from "@/lib/db";
import {
  ADMIN_ROBOTS,
  STATUS_TONE,
  fmtAgo,
  fmtDec,
  fmtInt,
  fmtWhen,
  requireAdmin,
  type SearchParams,
} from "@/lib/admin";
import { Badge, Card, EmptyState } from "@/components/ui";
import { AdminHeader, AdminLink, AdminNotice } from "../nav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leads",
  robots: ADMIN_ROBOTS,
};

const LIMIT = 100;

/* ── 数据 ─────────────────────────────────────────────────────── */

interface LeadRow {
  id: string;
  /** 真名。内部字段 —— 只有站长看得到这一页，对外任何地方都只准出现 masked_name */
  name: string;
  masked_name: string;
  slug: string;
  city: string | null;
  state: string | null;
  rating: unknown;
  reviews_count: number | null;
  buying_power: number | null;
  status: string;
  email: string | null;
  email_source: string | null;
  email_confidence: number | null;
  website: string | null;
  is_chain: boolean | null;
  cuisine: string | null;
  discovered_at: unknown;
  badness: number | null;
  design_slug: string | null;
}

async function loadLeads(): Promise<{ rows: LeadRow[]; total: number } | null> {
  try {
    const [rows, totals] = await Promise.all([
      sql`
        SELECT l.id, l.name, l.masked_name, l.slug, l.city, l.state, l.rating, l.reviews_count,
               l.buying_power, l.status, l.email, l.email_source, l.email_confidence,
               l.website, l.is_chain, l.cuisine, l.discovered_at,
               a.badness,
               d.slug AS design_slug
        FROM leads l
        LEFT JOIN LATERAL (
          SELECT badness FROM audits WHERE lead_id = l.id ORDER BY audited_at DESC LIMIT 1
        ) a ON true
        LEFT JOIN LATERAL (
          SELECT slug FROM designs WHERE lead_id = l.id ORDER BY built_at DESC LIMIT 1
        ) d ON true
        -- 只列入选的目标客户；被淘汰的留在库里只为去重，不进后台任何视图
        WHERE l.status NOT IN ('skipped','dead')
        ORDER BY l.discovered_at DESC
        LIMIT ${LIMIT}
      `,
      sql`SELECT count(*)::int AS n FROM leads WHERE status NOT IN ('skipped','dead')`,
    ]);
    return {
      rows: rows as LeadRow[],
      total: (totals as { n: number }[])[0]?.n ?? 0,
    };
  } catch (err) {
    console.error("[/admin/leads] query failed", err);
    return null;
  }
}

/* ── 零件 ─────────────────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-3">
        {label}
      </dt>
      <dd className="mt-1 truncate text-[0.88rem] text-ink">{children}</dd>
    </div>
  );
}

function scoreColor(n: number | null | undefined): string {
  if (typeof n !== "number") return "text-ink-3";
  if (n >= 70) return "text-ok";
  if (n >= 40) return "text-warn";
  return "text-ink-2";
}

function badnessColor(n: number | null | undefined): string {
  if (typeof n !== "number") return "text-ink-3";
  // badness 越高 = 官网越烂 = 对我们越是好线索
  if (n >= 70) return "text-accent";
  if (n >= 40) return "text-warn";
  return "text-ink-2";
}

function LeadCard({ lead }: { lead: LeadRow }) {
  const place = [lead.city, lead.state].filter(Boolean).join(", ") || "—";
  const slug = lead.design_slug;

  return (
    <Card as="li" size="sm" className="p-5 md:p-6">
      {/* 顶行：对外名 + 状态 */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 className="truncate text-[1.05rem] font-semibold text-ink">{lead.masked_name}</h2>
          <p className="mt-1 font-mono text-[0.72rem] text-ink-3">{lead.slug}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {lead.is_chain ? <Badge tone="warn">chain</Badge> : null}
          <Badge tone={STATUS_TONE[lead.status] ?? "neutral"}>{lead.status || "unknown"}</Badge>
        </div>
      </div>

      {/* 真名：明确标成内部字段，避免有人从后台复制到对外文案里 */}
      <div className="mt-4 rounded-[var(--r-sm)] bg-surface-inset px-4 py-3">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-3">
          Real name · internal field · never render this outside admin
        </p>
        <p className="mt-1 text-[0.95rem] font-medium text-ink">{lead.name}</p>
      </div>

      {/* 指标：390px 两列，桌面四列。永不横向滚动 */}
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
        <Field label="City">{place}</Field>
        <Field label="Rating">
          {fmtDec(lead.rating)}
          {lead.rating ? <span className="text-ink-3"> ★</span> : null}
        </Field>
        <Field label="Reviews">{fmtInt(lead.reviews_count)}</Field>
        <Field label="Buying power">
          <span className={scoreColor(lead.buying_power)}>{fmtInt(lead.buying_power)}</span>
        </Field>
        <Field label="Badness">
          <span className={badnessColor(lead.badness)}>
            {lead.badness === null || lead.badness === undefined ? "not audited" : fmtInt(lead.badness)}
          </span>
        </Field>
        <Field label="Cuisine">{lead.cuisine || "—"}</Field>
      </dl>

      {/* 邮箱 */}
      <div className="mt-5 border-t border-line pt-4">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-3">Email</p>
        {lead.email ? (
          <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <a
              href={`mailto:${lead.email}`}
              className="break-all font-mono text-[0.85rem] text-accent hover:text-accent-hover"
            >
              {lead.email}
            </a>
            <span className="text-[0.78rem] text-ink-3">
              {lead.email_source ?? "unknown source"} · confidence{" "}
              {fmtInt(lead.email_confidence ?? 0)}
            </span>
          </p>
        ) : (
          <p className="mt-1 text-[0.85rem] text-ink-3">No address found yet.</p>
        )}
      </div>

      {/* 链接 + 时间 */}
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        {slug ? (
          <>
            <AdminLink href={`/p/${slug}`} tone="accent">
              Pitch /p/{slug}
            </AdminLink>
            <AdminLink href={`/d/${slug}`}>Concept /d/{slug}</AdminLink>
          </>
        ) : (
          <span className="rounded-[var(--r-full)] bg-surface-inset px-3.5 py-2 text-[0.78rem] font-semibold text-ink-3">
            No concept built yet
          </span>
        )}
        {lead.website ? <AdminLink href={lead.website}>Their site</AdminLink> : null}
        <span className="ml-auto text-[0.75rem] text-ink-3">
          {fmtWhen(lead.discovered_at)} · {fmtAgo(lead.discovered_at)}
        </span>
      </div>
    </Card>
  );
}

/* ── 页面 ─────────────────────────────────────────────────────── */

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireAdmin(searchParams);
  const data = await loadLeads();

  return (
    <div className="pb-20">
      <AdminHeader
        session={session}
        active="/admin/leads"
        title="Leads"
        sub={
          data
            ? `Newest ${fmtInt(Math.min(data.rows.length, LIMIT))} of ${fmtInt(data.total)}, by discovery time. Real names are shown here because nobody else can reach this page.`
            : "Newest hundred leads by discovery time."
        }
      />

      <section className="shell">
        {!data ? (
          <AdminNotice>
            The leads query failed. Check DATABASE_URL and whether db/schema.sql has been applied.
          </AdminNotice>
        ) : data.rows.length === 0 ? (
          <EmptyState
            title="No leads yet"
            body="Task A has not discovered anything. Once the discovery job runs, the newest hundred show up here."
          />
        ) : (
          <ul className="space-y-3.5 md:space-y-4">
            {data.rows.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

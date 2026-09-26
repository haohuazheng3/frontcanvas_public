import type { Metadata } from "next";

import { sql } from "@/lib/db";
import {
  ADMIN_ROBOTS,
  fmtAgo,
  fmtInt,
  fmtWhen,
  parseJson,
  requireAdmin,
  shortValue,
  type SearchParams,
} from "@/lib/admin";
import { Badge, Card, EmptyState } from "@/components/ui";
import { AdminHeader, AdminNotice } from "../nav";
import { ResolveButton } from "./resolve-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Errors",
  robots: ADMIN_ROBOTS,
};

const LIMIT = 100;

/* ── 数据 ─────────────────────────────────────────────────────── */

interface ErrorRow {
  id: string;
  name: string | null;
  message: string | null;
  stack: string | null;
  route: string | null;
  severity: string | null;
  scope: string | null;
  meta: unknown;
  count: number | null;
  first_seen: unknown;
  last_seen: unknown;
}

async function loadErrors(): Promise<{ rows: ErrorRow[]; resolved: number } | null> {
  try {
    const [rows, resolved] = await Promise.all([
      sql`
        SELECT id, name, message, stack, route, severity, scope, meta, count, first_seen, last_seen
        FROM errors
        WHERE resolved = false
        ORDER BY last_seen DESC
        LIMIT ${LIMIT}
      `,
      sql`SELECT count(*)::int AS n FROM errors WHERE resolved = true`,
    ]);
    return {
      rows: rows as ErrorRow[],
      resolved: (resolved as { n: number }[])[0]?.n ?? 0,
    };
  } catch (err) {
    console.error("[/admin/errors] query failed", err);
    return null;
  }
}

const SEVERITY_TONE: Record<string, "neutral" | "warn" | "bad"> = {
  warn: "warn",
  error: "bad",
  fatal: "bad",
};

/* ── 零件 ─────────────────────────────────────────────────────── */

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.62rem] font-semibold uppercase tracking-[0.11em] text-ink-3">
        {label}
      </dt>
      <dd className="mt-1 truncate text-[0.83rem] text-ink-2">{value}</dd>
    </div>
  );
}

function ErrorCard({ row, adminKey }: { row: ErrorRow; adminKey: string | null }) {
  const severity = (row.severity ?? "error").toLowerCase();
  const meta = parseJson(row.meta);
  const metaEntries = meta ? Object.entries(meta).slice(0, 6) : [];

  return (
    <Card as="li" size="sm" className="p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={SEVERITY_TONE[severity] ?? "bad"}>{severity}</Badge>
        <span className="font-mono text-[0.9rem] font-semibold text-ink">
          {row.name || "Error"}
        </span>
        {row.scope ? <Badge>{row.scope}</Badge> : null}
        <span className="ml-auto text-[0.78rem] text-ink-3">×{fmtInt(row.count ?? 1)}</span>
      </div>

      <p className="mt-3.5 break-words font-mono text-[0.85rem] leading-relaxed text-ink-2">
        {row.message || "(no message)"}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5 sm:grid-cols-4">
        <Meta label="Route" value={row.route || "—"} />
        <Meta label="Seen" value={`${fmtInt(row.count ?? 1)} times`} />
        <Meta label="First seen" value={`${fmtWhen(row.first_seen)} · ${fmtAgo(row.first_seen)}`} />
        <Meta label="Last seen" value={`${fmtWhen(row.last_seen)} · ${fmtAgo(row.last_seen)}`} />
      </dl>

      {metaEntries.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {metaEntries.map(([k, v]) => (
            <li
              key={k}
              className="rounded-[var(--r-full)] bg-surface-inset px-3 py-1 font-mono text-[0.72rem] text-ink-2"
            >
              {k} <span className="font-semibold text-ink">{shortValue(v)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {row.stack ? (
        <details className="group mt-4">
          <summary className="tap inline-flex cursor-pointer list-none items-center gap-1.5 rounded-[var(--r-full)] bg-surface-inset px-3.5 py-2 text-[0.78rem] font-semibold text-ink-2 hover:text-ink">
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              aria-hidden="true"
              className="transition-transform duration-200 group-open:rotate-90"
            >
              <path
                d="M3.4 1.6 7 5l-3.6 3.4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Stack trace
          </summary>
          <pre className="mt-3 max-h-96 overflow-auto rounded-[var(--r-sm)] bg-surface-inset p-4 font-mono text-[0.72rem] leading-relaxed whitespace-pre-wrap break-words text-ink-2">
            {row.stack}
          </pre>
        </details>
      ) : (
        <p className="mt-4 text-[0.78rem] text-ink-3">No stack captured.</p>
      )}

      <div className="mt-5">
        <ResolveButton id={row.id} adminKey={adminKey} />
      </div>
    </Card>
  );
}

/* ── 页面 ─────────────────────────────────────────────────────── */

export default async function AdminErrorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireAdmin(searchParams);
  const data = await loadErrors();

  return (
    <div className="pb-20">
      <AdminHeader
        session={session}
        active="/admin/errors"
        title="Errors"
        sub={
          data
            ? `Everything still unresolved, newest first. ${fmtInt(data.resolved)} have already been cleared.`
            : "Everything still unresolved, newest first."
        }
      />

      <section className="shell">
        {!data ? (
          <AdminNotice>
            The errors query failed — which is its own kind of answer. Check DATABASE_URL and
            whether db/schema.sql has been applied.
          </AdminNotice>
        ) : data.rows.length === 0 ? (
          <EmptyState
            title="Inbox is empty"
            body="Nothing unresolved. Either the pipeline is behaving or nothing has run yet."
          />
        ) : (
          <ul className="space-y-3.5 md:space-y-4">
            {data.rows.map((row) => (
              <ErrorCard key={row.id} row={row} adminKey={session.key} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { sql } from "@/lib/db";
import { Card, Eyebrow, Section } from "@/components/ui";
import { UnsubscribeForm } from "@/components/unsubscribe-form";
import { CONTACT_EMAIL } from "@/components/site-footer";

/* 退订链接带的是一次性 token，现取现渲染，绝不进构建产物、绝不进搜索引擎 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Stop emails from FrontCanvas. One click, no account, no reason required.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

/* ── token → 地址 ─────────────────────────────────────────────
   链接可以被转发、被抄进浏览器历史、被公司邮件网关预抓。
   所以页面上只回显打码后的地址：足够让本人认出「是我」，
   不足以让别人从这个 URL 里读出一个完整邮箱。                 */

function maskEmail(raw: string): string {
  const at = raw.lastIndexOf("@");
  if (at < 1) return "your address";

  const local = raw.slice(0, at);
  const domain = raw.slice(at + 1);
  const masked =
    local.length <= 2 ? `${local[0]}***` : `${local[0]}***${local[local.length - 1]}`;

  return `${masked}@${domain}`;
}

async function lookup(token: string): Promise<string | null> {
  try {
    const rows = (await sql`
      SELECT to_email FROM outreach WHERE unsub_token = ${token} LIMIT 1
    `) as { to_email: string }[];
    const email = rows[0]?.to_email;
    return email ? maskEmail(email.trim().toLowerCase()) : null;
  } catch {
    // 数据库出问题不该把人挡在退订门外 —— 退回手输那条路，照样能退。
    return null;
  }
}

/* ── 承诺 ─────────────────────────────────────────────────── */

const PROMISES: { title: string; body: string }[] = [
  {
    title: "We stop within ten days",
    body: "The law gives us ten business days. In practice the address is suppressed the moment you tap the button, and anything already sitting in the queue for it is cancelled.",
  },
  {
    title: "We do not add it back",
    body: "The address goes on a permanent suppression list that every future send is checked against. A new import cannot resurrect it, and a new campaign cannot either.",
  },
  {
    title: "Nothing else is asked of you",
    body: "No account, no password, no survey, no confirmation email to go find. Your address is the only thing we need, and we never sell or share it.",
  },
];

/* ── 页面 ─────────────────────────────────────────────────── */

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const raw = params.t;
  const token = (Array.isArray(raw) ? raw[0] : raw)?.trim() || undefined;

  const maskedEmail = token ? await lookup(token) : null;

  // token 查不到（链接被改过、那封信早被清了）：不报错，直接给手输表单。
  const usableToken = maskedEmail ? token : undefined;

  return (
    <Section>
      <header className="mb-9 max-w-[46rem] md:mb-12">
        <Eyebrow>Unsubscribe</Eyebrow>
        <h1 className="display mt-3 text-[2rem] leading-[1.08] text-ink md:text-[2.9rem]">
          No hard feelings
        </h1>
        <p className="mt-5 max-w-[40rem] text-[1.05rem] leading-relaxed text-ink-2">
          We write to restaurants once, with a design already made. If that is not something you
          want in your inbox, this page ends it for good.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[1.05fr_0.95fr] md:items-start md:gap-8">
        <Card size="lg" className="p-6 md:p-10">
          <UnsubscribeForm
            token={usableToken}
            maskedEmail={maskedEmail ?? undefined}
            linkExpired={Boolean(token && !maskedEmail)}
          />
        </Card>

        <aside>
          <Card size="lg" className="p-7 md:p-8">
            <h2 className="display text-[1.35rem] text-ink">What happens after you tap</h2>
            <dl className="mt-6 space-y-6">
              {PROMISES.map((p) => (
                <div key={p.title}>
                  <dt className="text-[0.95rem] font-semibold text-ink">{p.title}</dt>
                  <dd className="mt-1.5 text-[0.9rem] leading-relaxed text-ink-2">{p.body}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-8 border-t border-line pt-6 text-[0.875rem] leading-relaxed text-ink-3">
              Something not working? Write to{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="tap font-medium break-all text-accent underline decoration-accent-line underline-offset-4 hover:text-accent-hover"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              and a person will remove you by hand. Our{" "}
              <Link
                href="/privacy"
                className="tap font-medium text-accent underline decoration-accent-line underline-offset-4 hover:text-accent-hover"
              >
                privacy policy
              </Link>{" "}
              explains what we keep and for how long.
            </p>
          </Card>
        </aside>
      </div>
    </Section>
  );
}

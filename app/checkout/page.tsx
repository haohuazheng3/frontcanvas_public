import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Card, Eyebrow } from "@/components/ui";
import { CheckoutButton } from "./checkout-button";
import { TIER_BY_ID, formatPrice, depositCents, type TierId } from "@/lib/pricing";
import { sql } from "@/lib/db";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; d?: string }>;
}) {
  const { tier: tierParam, d } = await searchParams;
  const tier = TIER_BY_ID[(tierParam ?? "") as TierId];
  if (!tier) redirect("/pricing");

  // 账号先于支付：没登录先去登录，登录完自动回到这里，流程不断
  const { userId } = await auth();
  const backTo = `/checkout?tier=${tier.id}${d ? `&d=${encodeURIComponent(d)}` : ""}`;
  if (!userId) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(backTo)}`);
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

  // 如果是从某张概念稿点进来的，把它显示出来，让人知道自己在买什么
  let concept: { slug: string; masked_name: string } | null = null;
  if (d) {
    const rows = (await sql`
      SELECT d.slug, l.masked_name
      FROM designs d JOIN leads l ON l.id = d.lead_id
      WHERE d.slug = ${d} LIMIT 1
    `) as { slug: string; masked_name: string }[];
    concept = rows[0] ?? null;
  }

  const due = tier.interval ? tier.amountCents : depositCents(tier);
  const remaining = tier.interval ? 0 : tier.amountCents - due;

  return (
    <div className="shell flex min-h-[70svh] items-center justify-center py-14">
      <Card size="lg" className="w-full max-w-[34rem] p-7 md:p-10">
        <Eyebrow>Confirm</Eyebrow>
        <h1 className="display mt-3 text-[2rem] leading-tight text-ink">{tier.name}</h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-2">{tier.tagline}</p>

        {concept && (
          <div className="mt-6 rounded-[var(--r-md)] bg-surface-inset p-4">
            <p className="text-[0.85rem] text-ink-2">
              Building out the concept for{" "}
              <span className="font-semibold text-ink">{concept.masked_name}</span>.{" "}
              <Link href={`/p/${concept.slug}`} className="tap text-accent hover:text-accent-hover">
                View it again
              </Link>
            </p>
          </div>
        )}

        <dl className="mt-7 space-y-3 border-t border-line pt-6 text-[0.925rem]">
          <div className="flex items-baseline justify-between">
            <dt className="text-ink-2">{tier.interval ? "Billed monthly" : "Project total"}</dt>
            <dd className="font-semibold text-ink">{formatPrice(tier.amountCents)}</dd>
          </div>
          {!tier.interval && (
            <div className="flex items-baseline justify-between">
              <dt className="text-ink-2">Balance at launch</dt>
              <dd className="text-ink-2">{formatPrice(remaining)}</dd>
            </div>
          )}
          <div className="flex items-baseline justify-between border-t border-line pt-3">
            <dt className="font-semibold text-ink">Due today</dt>
            <dd className="display text-[1.6rem] text-ink">{formatPrice(due)}</dd>
          </div>
        </dl>

        <div className="mt-8">
          <CheckoutButton tier={tier.id} designSlug={d ?? null} />
        </div>

        <p className="mt-5 text-center text-[0.78rem] leading-relaxed text-ink-3">
          Signed in as {email}. Payment is handled by Stripe — we never see your card.
          <br />
          <Link href="/refunds" className="tap underline underline-offset-2 hover:text-ink-2">
            Refunds &amp; cancellation
          </Link>
        </p>
      </Card>
    </div>
  );
}

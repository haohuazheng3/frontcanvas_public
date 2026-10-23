import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Card, Eyebrow } from "@/components/ui";
import { ButtonLink } from "@/components/button";
import { verifyAndGrant } from "@/lib/entitlements";
import { reportError } from "@/lib/errors";
import { formatPrice, TIER_BY_ID, type TierId } from "@/lib/pricing";
import { CONTACT_EMAIL } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Payment received",
  robots: { index: false, follow: false },
};

// 写后立刻读，绝不缓存 —— 这一页的全部意义就是「现在」确认权益已落地
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  await auth();

  let order = null;
  let failed = false;

  if (session_id) {
    try {
      // 主路径：直接问 Stripe 要真相并当场解锁，不等 webhook
      order = await verifyAndGrant(session_id);
    } catch (e) {
      failed = true;
      await reportError({
        name: "CheckoutVerifyFailed",
        message: (e as Error).message,
        stack: (e as Error).stack,
        route: "/checkout/success",
        scope: "server",
        severity: "fatal",
        meta: { session_id },
      });
    }
  }

  const tier = order ? TIER_BY_ID[order.tier as TierId] : null;

  return (
    <div className="shell flex min-h-[70svh] items-center justify-center py-14">
      <Card size="lg" className="w-full max-w-[34rem] p-7 text-center md:p-11">
        {order ? (
          <>
            <div className="mx-auto grid size-12 place-items-center rounded-[var(--r-md)] bg-ok-soft">
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round" className="text-ok" />
              </svg>
            </div>
            <Eyebrow>Payment received</Eyebrow>
            <h1 className="display mt-3 text-[2.1rem] leading-tight text-ink">
              We are on it.
            </h1>
            <p className="mx-auto mt-4 max-w-[38ch] text-[0.975rem] leading-relaxed text-ink-2">
              {formatPrice(order.amount_cents)} received for {tier?.name ?? order.tier}. A receipt is
              on its way to {order.email}. We will email you within one business day to get your
              menu, photos, and domain details — that is everything we need from you.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/account" size="lg">Your order</ButtonLink>
              <ButtonLink href="/" variant="ghost" size="lg">Back to site</ButtonLink>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto grid size-12 place-items-center rounded-[var(--r-md)] bg-warn-soft">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 5.5v5M10 14.2v.3" stroke="currentColor" strokeWidth="2.2"
                  strokeLinecap="round" className="text-warn" />
              </svg>
            </div>
            <h1 className="display mt-5 text-[1.9rem] leading-tight text-ink">
              {failed ? "We could not confirm this yet" : "Nothing to confirm here"}
            </h1>
            <p className="mx-auto mt-4 max-w-[40ch] text-[0.95rem] leading-relaxed text-ink-2">
              {failed
                ? "Your payment may still have gone through — our records just have not caught up. Do not pay again. We have been alerted and will sort it out; you can also email us and we will confirm within the hour."
                : "This page confirms a completed payment. If you just paid and landed here, check your email for the Stripe receipt."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href={`mailto:${CONTACT_EMAIL}`} size="lg">Email us</ButtonLink>
              <ButtonLink href="/pricing" variant="ghost" size="lg">Pricing</ButtonLink>
            </div>
          </>
        )}

        <p className="mt-8 border-t border-line pt-6 text-[0.78rem] text-ink-3">
          Questions about this charge?{" "}
          <Link href="/refunds" className="tap underline underline-offset-2 hover:text-ink-2">
            Refunds &amp; cancellation
          </Link>
        </p>
      </Card>
    </div>
  );
}

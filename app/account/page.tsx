import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Card, EmptyState, Eyebrow } from "@/components/ui";
import { ButtonLink } from "@/components/button";
import { ordersForUser } from "@/lib/entitlements";
import { formatPrice, TIER_BY_ID, type TierId } from "@/lib/pricing";
import { CONTACT_EMAIL } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=%2Faccount");

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const orders = await ordersForUser(userId);

  return (
    <div className="shell py-14 md:py-20">
      <Eyebrow>Your account</Eyebrow>
      <h1 className="display mt-3 text-[2.3rem] leading-tight text-ink md:text-[3rem]">
        {email}
      </h1>

      <div className="mt-10 max-w-[46rem]">
        {orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            body="When you start a project with us it will show up here, along with everything we need from you to get going."
            action={<ButtonLink href="/pricing">See pricing</ButtonLink>}
          />
        ) : (
          <ul className="space-y-4">
            {orders.map((o) => {
              const tier = TIER_BY_ID[o.tier as TierId];
              return (
                <Card as="li" key={o.id} className="p-6 md:p-7">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h2 className="display text-[1.4rem] text-ink">{tier?.name ?? o.tier}</h2>
                    <span className="display text-[1.3rem] text-ink">
                      {formatPrice(o.amount_cents)}
                    </span>
                  </div>
                  <p className="mt-2 text-[0.9rem] text-ink-2">{tier?.tagline}</p>
                  <p className="mt-4 text-[0.8rem] text-ink-3">
                    Paid{" "}
                    {o.paid_at
                      ? new Date(o.paid_at).toLocaleDateString("en-US", {
                          year: "numeric", month: "long", day: "numeric",
                        })
                      : "—"}
                    {" · "}Order {o.id.slice(-8)}
                  </p>
                </Card>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-10 text-[0.875rem] text-ink-3">
        Need something changed?{" "}
        <Link href={`mailto:${CONTACT_EMAIL}`} className="tap text-accent hover:text-accent-hover">
          {CONTACT_EMAIL}
        </Link>
      </p>
    </div>
  );
}

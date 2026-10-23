import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { createCheckoutSession } from "@/lib/stripe";
import { withErrorReporting } from "@/lib/errors";
import { TIER_BY_ID } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  tier: z.enum(["launch", "complete", "care"]),
  designSlug: z.string().max(40).nullish(),
});

export const POST = withErrorReporting("/api/checkout", async (req: Request) => {
  // 账号先于支付：没有账号就没有可以挂载权益的地方，付了也会丢
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) {
    return NextResponse.json({ ok: false, reason: "no_email" }, { status: 400 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  }

  const tier = TIER_BY_ID[parsed.data.tier];
  if (!tier) return NextResponse.json({ ok: false, reason: "unknown_tier" }, { status: 400 });

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    req.headers.get("origin") ??
    "https://frontcanvas.com";

  const session = await createCheckoutSession({
    tierId: parsed.data.tier,
    email,
    userId,
    designSlug: parsed.data.designSlug ?? null,
    origin,
  });

  if (!session.url) {
    return NextResponse.json({ ok: false, reason: "no_session_url" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, url: session.url });
});

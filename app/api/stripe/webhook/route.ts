import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { sql } from "@/lib/db";
import { grantFromSession } from "@/lib/entitlements";
import { reportError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 解锁双保险的**兜底**那一半。
 * 主路径是用户回跳 success 页时服务端主动向 Stripe 核验（见 /checkout/success）。
 * 这里负责：用户关掉浏览器、网络断了、或异步支付方式晚到的情况。
 *
 * 三条纪律：验签、按 event.id 幂等、失败必须写错误收件箱（绝不静默吞）。
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  if (!secret || !sig) {
    await reportError({
      name: "StripeWebhookMisconfigured",
      message: `webhook 收到请求但 ${!secret ? "STRIPE_WEBHOOK_SECRET 未配置" : "缺少签名头"}`,
      route: "/api/stripe/webhook",
      scope: "server",
      severity: "fatal",
    });
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    await reportError({
      name: "StripeSignatureInvalid",
      message: (e as Error).message,
      route: "/api/stripe/webhook",
      scope: "server",
      severity: "fatal",
    });
    return NextResponse.json({ ok: false, reason: "bad_signature" }, { status: 400 });
  }

  // 幂等：Stripe 会重投，同一个 event.id 只处理一次
  const dup = (await sql`
    INSERT INTO stripe_events (event_id, type) VALUES (${event.id}, ${event.type})
    ON CONFLICT (event_id) DO NOTHING RETURNING event_id
  `) as { event_id: string }[];
  if (dup.length === 0) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        await grantFromSession(event.data.object as Stripe.Checkout.Session);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
        if (pi) {
          await sql`UPDATE orders SET status = 'refunded' WHERE stripe_pi = ${pi}`;
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await sql`UPDATE orders SET status = 'canceled' WHERE stripe_pi = ${sub.id}`;
        break;
      }
      default:
        break; // 其余事件记录即可
    }
  } catch (e) {
    // 处理失败要把幂等标记撤回，否则 Stripe 重投时会被当成已处理而永久丢失
    await sql`DELETE FROM stripe_events WHERE event_id = ${event.id}`;
    await reportError({
      name: "StripeWebhookHandlerFailed",
      message: (e as Error).message,
      stack: (e as Error).stack,
      route: "/api/stripe/webhook",
      scope: "server",
      severity: "fatal",
      meta: { eventId: event.id, type: event.type },
    });
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

import type Stripe from "stripe";
import { sql, newId } from "./db";
import { stripe } from "./stripe";
import { TIER_BY_ID, type TierId } from "./pricing";

export interface Order {
  id: string;
  user_id: string | null;
  email: string;
  tier: TierId;
  amount_cents: number;
  status: "pending" | "paid" | "refunded" | "canceled";
  stripe_session_id: string | null;
  design_id: string | null;
  paid_at: string | null;
  created_at: string;
}

/**
 * 从一个已付款的 Checkout Session 落权益。
 *
 * 这是解锁双保险里两条路径**共用**的落库函数：
 *   - 主路径：用户回跳 success 页，服务端拿 session_id 主动向 Stripe 核验后调用它
 *   - 兜底：webhook 异步收到 checkout.session.completed 后调用它
 * 所以它必须幂等 —— 按 stripe_session_id 去重，重复调用不会产生第二笔订单。
 */
export async function grantFromSession(session: Stripe.Checkout.Session): Promise<Order | null> {
  const paid = session.payment_status === "paid" || session.status === "complete";
  if (!paid) return null;

  const tier = (session.metadata?.tier ?? "") as TierId;
  if (!TIER_BY_ID[tier]) return null;

  const email =
    session.customer_details?.email ?? session.customer_email ?? "";
  const userId = session.client_reference_id ?? session.metadata?.userId ?? null;
  const designSlug = session.metadata?.designSlug || null;

  let designId: string | null = null;
  let leadId: string | null = null;
  if (designSlug) {
    const rows = (await sql`
      SELECT id, lead_id FROM designs WHERE slug = ${designSlug} LIMIT 1
    `) as { id: string; lead_id: string }[];
    designId = rows[0]?.id ?? null;
    leadId = rows[0]?.lead_id ?? null;
  }

  const rows = (await sql`
    INSERT INTO orders (id, user_id, email, lead_id, design_id, tier,
      stripe_session_id, stripe_pi, amount_cents, currency, status, paid_at)
    VALUES (${newId("ord_")}, ${userId}, ${email}, ${leadId}, ${designId}, ${tier},
      ${session.id}, ${typeof session.payment_intent === "string" ? session.payment_intent : null},
      ${session.amount_total ?? 0}, ${session.currency ?? "usd"}, 'paid', now())
    ON CONFLICT (stripe_session_id) DO UPDATE
      SET status = 'paid',
          paid_at = COALESCE(orders.paid_at, now()),
          user_id = COALESCE(orders.user_id, EXCLUDED.user_id),
          stripe_pi = COALESCE(orders.stripe_pi, EXCLUDED.stripe_pi)
    RETURNING *
  `) as Order[];

  if (leadId) {
    await sql`UPDATE leads SET status = 'won', updated_at = now() WHERE id = ${leadId}`;
  }

  return rows[0] ?? null;
}

/**
 * 主路径解锁：拿 session_id 直接问 Stripe，绝不干等 webhook。
 * webhook 可能迟到、可能失败、可能被重放 —— 用户此刻正盯着屏幕，不能让他等。
 */
export async function verifyAndGrant(sessionId: string): Promise<Order | null> {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return grantFromSession(session);
}

/** 写后立刻读，绝不走缓存 —— 支付解锁最怕读到旧值 */
export async function ordersForUser(userId: string): Promise<Order[]> {
  return (await sql`
    SELECT * FROM orders
    WHERE user_id = ${userId} AND status = 'paid'
    ORDER BY created_at DESC
  `) as Order[];
}

export async function hasPaidTier(userId: string, tier: TierId): Promise<boolean> {
  const rows = (await sql`
    SELECT 1 FROM orders
    WHERE user_id = ${userId} AND tier = ${tier} AND status = 'paid' LIMIT 1
  `) as unknown[];
  return rows.length > 0;
}

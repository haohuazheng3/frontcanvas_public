import Stripe from "stripe";
import { TIER_BY_ID, type TierId, type Tier, depositCents } from "./pricing";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-07-29.dahlia",
  typescript: true,
});

/**
 * 品牌一致性：同一个 Stripe 账号跑多个站，Checkout 上必须显示本站品牌，
 * 否则买家在扣款前看到别的名字就会弃单。
 *
 * 关键认知（Stripe 硬边界）：
 *   - branding_settings.display_name 只覆盖 Checkout 左上角的品牌名文字。
 *   - 支付按钮下方的授权句与浏览器标签标题取的是账号级 Public business name，
 *     session 层改不了。所以下面用 custom_text 明说母子关系，不制造歧义。
 *   - 账单描述符另外用 statement_descriptor_suffix 带上本站品牌。
 *
 * 站点 → 品牌的映射写死在后端白名单里，绝不允许前端传入品牌名，
 * 否则别人能借我们的付款页冒充其他品牌。
 */
const BRAND = {
  displayName: "FrontCanvas",
  statementSuffix: "FRONTCANVAS", // 最长 22 个拉丁字符，实际显示为 PARENT* FRONTCANVAS
} as const;

export function priceLookupKey(tier: Tier): string {
  return tier.lookupKey;
}

/** 用 lookup_key 找价格 —— 比写死 price_id 稳，换价不用改代码 */
export async function findPrice(tierId: TierId): Promise<Stripe.Price | null> {
  const tier = TIER_BY_ID[tierId];
  if (!tier) return null;
  const res = await stripe.prices.list({
    lookup_keys: [tier.lookupKey],
    active: true,
    limit: 1,
  });
  return res.data[0] ?? null;
}

export interface CheckoutInput {
  tierId: TierId;
  email: string;
  userId: string;
  designSlug?: string | null;
  origin: string;
}

export async function createCheckoutSession(input: CheckoutInput) {
  const tier = TIER_BY_ID[input.tierId];
  if (!tier) throw new Error(`未知档位: ${input.tierId}`);

  const price = await findPrice(input.tierId);
  if (!price) throw new Error(`Stripe 里找不到 lookup_key=${tier.lookupKey} 的价格`);

  const isSubscription = !!tier.interval;
  const amount = isSubscription ? tier.amountCents : depositCents(tier);

  const explain = isSubscription
    ? `${BRAND.displayName} — ${tier.name}. Cancel any time from your account.`
    : `This is a 50% deposit on ${tier.name} ($${(tier.amountCents / 100).toLocaleString("en-US")} total). The balance is due when your site goes live. Your card statement will show ${BRAND.statementSuffix}.`;

  return stripe.checkout.sessions.create({
    mode: isSubscription ? "subscription" : "payment",
    line_items: [{ price: price.id, quantity: 1 }],
    customer_email: input.email,
    client_reference_id: input.userId,
    // Checkout 左上角显示品牌名文字（只传 display_name，不上传 logo —— 传了 logo 会顶掉文字名）
    branding_settings: { display_name: BRAND.displayName },
    custom_text: { submit: { message: explain } },
    ...(isSubscription
      ? {}
      : {
          payment_intent_data: {
            statement_descriptor_suffix: BRAND.statementSuffix,
          },
        }),
    metadata: {
      tier: input.tierId,
      userId: input.userId,
      designSlug: input.designSlug ?? "",
      amountCents: String(amount),
    },
    success_url: `${input.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/pricing?canceled=1`,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
  });
}

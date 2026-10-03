import { NextResponse, after, type NextRequest } from "next/server";
import { newId, sql } from "@/lib/db";
import { ADMIN_COOKIE, secretMatches } from "@/lib/admin";
import { APP_URL, notifyOwner, telLink } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 商家真的打开了稿子。
 *
 * 由 /p/ 展示页和 /d/ 设计稿上的一小段脚本在「页面可见 2 秒后」回报（sendBeacon）。
 * 不在服务端渲染时记：邮件网关（Safe Links、Proofpoint 之类）会替收件人先抓一遍链接，
 * 那种访问不执行脚本、也不会停留，算进来就是假阳性。
 *
 * 商家第一次打开时给站长发通知 —— 这是整条流水线里最热的一刻。
 */

const SLUG = /^[a-z0-9]{6,14}$/;
const BOT = /bot|crawl|spider|slurp|preview|headless|scanner|curl|wget|python|go-http|java\/|httpclient|facebookexternalhit|proofpoint|mimecast|barracuda|safelinks/i;

export async function POST(req: NextRequest) {
  try {
    // sendBeacon 发来的可能是 text/plain，统一按文本读再解析
    const body = JSON.parse((await req.text()) || "{}") as { s?: string; p?: string };
    const slug = String(body.s ?? "");
    const page = body.p === "d" ? "d" : "p";
    if (!SLUG.test(slug)) return new NextResponse(null, { status: 204 });

    // 站长自己看稿子（带后台 cookie）不算
    if (secretMatches(req.cookies.get(ADMIN_COOKIE)?.value)) return new NextResponse(null, { status: 204 });
    const ua = req.headers.get("user-agent") ?? "";
    if (!ua || BOT.test(ua)) return new NextResponse(null, { status: 204 });

    const rows = (await sql`
      WITH prev AS (SELECT id, first_viewed_at FROM designs WHERE slug = ${slug} LIMIT 1)
      UPDATE designs d
         SET views = COALESCE(d.views, 0) + 1,
             first_viewed_at = COALESCE(d.first_viewed_at, now()),
             last_viewed_at = now()
        FROM prev
       WHERE d.id = prev.id
      RETURNING d.lead_id, prev.first_viewed_at AS was_viewed
    `) as { lead_id: string; was_viewed: unknown }[];
    const hit = rows[0];
    if (!hit) return new NextResponse(null, { status: 204 });

    const city = decodeURIComponent(req.headers.get("x-vercel-ip-city") ?? "") || null;
    const country = req.headers.get("x-vercel-ip-country") || null;
    const device = /Mobi|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop";

    await sql`
      INSERT INTO design_views (id, lead_id, slug, page, source, device, city, country)
      VALUES (${newId("dv_")}, ${hit.lead_id}, ${slug}, ${page}, 'beacon', ${device}, ${city}, ${country})
    `;

    if (!hit.was_viewed) {
      after(async () => {
        try {
          const [lead] = (await sql`
            SELECT l.name, l.city, l.phone,
                   (SELECT max(sent_at) FROM outreach o WHERE o.lead_id = l.id AND o.status = 'sent') AS sent_at
            FROM leads l WHERE l.id = ${hit.lead_id}
          `) as { name: string; city: string | null; phone: string | null; sent_at: unknown }[];
          if (!lead) return;
          const sentAt = lead.sent_at ? new Date(String(lead.sent_at)) : null;
          const hours = sentAt ? Math.round((Date.now() - sentAt.getTime()) / 3_600_000) : null;
          await notifyOwner(`👀 ${lead.name} 打开了你给他们做的稿子`, [
            `${lead.name}${lead.city ? `（${lead.city}）` : ""}刚刚第一次打开了${page === "d" ? "设计稿" : "展示页"}（${device === "mobile" ? "手机" : "电脑"}）。`,
            hours !== null ? `邮件是 ${hours < 48 ? `${hours} 小时` : `${Math.round(hours / 24)} 天`}前发出的。` : "",
            "",
            `电话：${telLink(lead.phone)}`,
            `展示页：${APP_URL}/p/${slug}`,
            `设计稿：${APP_URL}/d/${slug}`,
            `后台：${APP_URL}/admin`,
            "",
            "建议趁热打个电话（下午 2–4 点，避开饭点）。开场说「上周给你们发过一版重新设计的网站，想听听你们的看法」——",
            "不要提我们知道他们看过。",
          ].filter((l, i, a) => l !== "" || a[i - 1] !== ""));
        } catch (err) {
          console.error("[/api/view] notify failed", err);
        }
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    // 回报失败绝不能影响商家看稿子
    console.error("[/api/view] failed", err);
    return new NextResponse(null, { status: 204 });
  }
}

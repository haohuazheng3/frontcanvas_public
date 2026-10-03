import nodemailer from "nodemailer";

/**
 * 给站长本人发通知邮件（不是发给商家的）。
 *
 * 只在两件事上用：商家第一次打开稿子、商家提交「我想要这个网站」。
 * 这两刻是整条流水线里最热的线索，等第二天的收件箱日报就晚了 ——
 * 2026-10 复盘时发现 7 家看过稿子的商家，当时没有任何人知道。
 *
 * 收件人走 OWNER_NOTIFY_EMAIL；没配或 SMTP 不全就静默跳过，绝不影响商家那边的请求。
 */

let transport: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter | null {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  if (!transport) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transport;
}

export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://frontcanvas.com").replace(/\/$/, "");

export async function notifyOwner(subject: string, lines: string[]): Promise<boolean> {
  const to = process.env.OWNER_NOTIFY_EMAIL;
  const t = getTransport();
  if (!to || !t) {
    console.warn("[notify] OWNER_NOTIFY_EMAIL 或 SMTP 未配置，跳过通知：", subject);
    return false;
  }
  await t.sendMail({
    from: `FrontCanvas 提醒 <${process.env.MAIL_FROM ?? process.env.SMTP_USER}>`,
    to,
    subject,
    text: lines.join("\n"),
  });
  return true;
}

/** 电话号码转成能直接点的 tel: 链接文本（通知邮件在手机上看，点一下就能拨） */
export function telLink(phone: string | null | undefined): string {
  if (!phone) return "（库里没有电话）";
  const digits = phone.replace(/[^\d+]/g, "");
  return `${phone}  tel:${digits.startsWith("+") ? digits : `+1${digits.replace(/^1/, "")}`}`;
}

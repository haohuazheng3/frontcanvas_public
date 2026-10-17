"use client";

import { useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { Button } from "@/components/button";
import { Card } from "@/components/ui";

type Status = "idle" | "sending" | "sent" | "error";
type FieldErrors = { email?: string; message?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const MIN_MESSAGE = 10;

/**
 * 输入框圆角走内联 style —— globals.css 里的 :focus-visible 是无 layer 规则，
 * 会盖掉 Tailwind 工具类上的 border-radius，聚焦时圆角会突然缩小。
 */
const RADIUS = { borderRadius: "var(--r-md)" } as const;

const FIELD =
  "w-full bg-surface-inset px-4 py-3.5 text-[0.95rem] text-ink placeholder:text-ink-4 " +
  "transition-colors duration-150 focus:bg-surface-2";
const LABEL = "block text-[0.875rem] font-medium text-ink";

/** 服务端快照 false、客户端快照 true —— 用它判断「已经 hydrate 了没有」 */
const subscribeNothing = () => () => {};

export function ContactForm({ source = "contact-page" }: { source?: string }) {
  const uid = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);

  const pending = status === "sending";

  /**
   * hydrate 之前按钮不可提交。
   *
   * 原因：这一瞬间 React 的 onSubmit 还没挂上，点击（或在输入框里按回车）
   * 会走浏览器原生提交 —— 访客的邮箱和留言被拼进 URL 查询串，进而落到
   * 访问日志、浏览器历史和 Referer 头里。表单本来就靠 fetch 工作，
   * 没有 JS 时它做不了任何事，那就干脆在那之前别装作能用。
   */
  const ready = useSyncExternalStore(subscribeNothing, () => true, () => false);

  function set(key: keyof typeof values, v: string) {
    setValues((p) => ({ ...p, [key]: v }));
    if (key !== "name" && errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    const email = values.email.trim();
    const message = values.message.trim();

    if (!email) next.email = "We need an address to write back to.";
    else if (!EMAIL_RE.test(email)) next.email = "That email address does not look right.";

    if (!message) next.message = "Tell us a little about the restaurant.";
    else if (message.length < MIN_MESSAGE)
      next.message = `A few more words, please — at least ${MIN_MESSAGE} characters.`;

    return next;
  }

  function stumble(msg: string) {
    setFailure(msg);
    setStatus("error");
  }

  function reset() {
    setValues({ name: "", email: "", message: "" });
    setErrors({});
    setFailure(null);
    setStatus("idle");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;

    const found = validate();
    setErrors(found);
    if (found.email || found.message) {
      (found.email ? emailRef : messageRef).current?.focus();
      return;
    }

    // 乐观更新：按下就变，不等接口。
    setFailure(null);
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          message: values.message.trim(),
          website: honeypot.current?.value ?? "",
          source,
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!res.ok || !data?.ok) {
        stumble(
          data?.error ??
            "Something broke on our side. Please try again, or email contact@frontcanvas.com."
        );
        return;
      }

      setStatus("sent");
    } catch {
      stumble("We could not reach the studio. Check your connection and try again.");
    }
  }

  /* ── 成功态：整张卡换掉，不弹窗、不 alert ─────────────── */

  if (status === "sent") {
    return (
      <Card size="lg" className="p-7 md:p-10">
        <div className="rise" role="status">
          <div className="grid size-12 place-items-center rounded-[var(--r-md)] bg-ok-soft">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path
                d="M5 11.4 9.2 15.5 17 7.5"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-ok"
              />
            </svg>
          </div>
          <h2 className="display mt-6 text-[1.65rem] text-ink md:text-[1.9rem]">
            Your note is in.
          </h2>
          <p className="mt-3.5 max-w-[44ch] text-[0.975rem] leading-relaxed text-ink-2">
            It landed in the studio inbox — no queue, no ticket number. One of us reads it and
            writes back within one business day.
          </p>
          <Button variant="ghost" size="sm" className="mt-7 -ml-3.5" onClick={reset}>
            Send another message
          </Button>
        </div>
      </Card>
    );
  }

  /* ── 表单 ─────────────────────────────────────────────── */

  return (
    <Card size="lg" className="p-6 md:p-10">
      <h2 className="display text-[1.5rem] text-ink md:text-[1.75rem]">Write to us</h2>
      <p className="mt-2.5 text-[0.95rem] leading-relaxed text-ink-2">
        Three fields. No forms to fill twice, no discovery call to book.
      </p>

      {/* method="post" 是第二道保险：万一真发生原生提交，也绝不把留言写进 URL */}
      <form onSubmit={onSubmit} method="post" noValidate className="relative mt-8">
        {/* 蜜罐：视觉隐藏、键盘跳过、屏幕阅读器不念。填了就静默丢弃。 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 -left-[9999px] h-0 w-0 overflow-hidden"
        >
          <label htmlFor={`${uid}-website`}>Website</label>
          <input
            ref={honeypot}
            id={`${uid}-website`}
            name="website"
            type="text"
            defaultValue=""
            tabIndex={-1}
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore=""
          />
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor={`${uid}-name`} className={LABEL}>
              Your name <span className="font-normal text-ink-4">— optional</span>
            </label>
            <input
              id={`${uid}-name`}
              name="name"
              type="text"
              autoComplete="name"
              maxLength={120}
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Who are we writing back to?"
              className={`mt-2 ${FIELD}`}
              style={RADIUS}
            />
          </div>

          <div>
            <label htmlFor={`${uid}-email`} className={LABEL}>
              Email
            </label>
            <input
              ref={emailRef}
              id={`${uid}-email`}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={200}
              required
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
              onBlur={() => {
                const v = validate();
                if (v.email) setErrors((p) => ({ ...p, email: v.email }));
              }}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? `${uid}-email-error` : undefined}
              placeholder="you@yourrestaurant.com"
              className={`mt-2 ${FIELD} ${errors.email ? "ring-1 ring-bad" : ""}`}
              style={RADIUS}
            />
            {errors.email && (
              <p id={`${uid}-email-error`} className="mt-2 text-[0.825rem] text-bad">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${uid}-message`} className={LABEL}>
              What should we know?
            </label>
            <textarea
              ref={messageRef}
              id={`${uid}-message`}
              name="message"
              rows={6}
              maxLength={5000}
              required
              value={values.message}
              onChange={(e) => set("message", e.target.value)}
              onBlur={() => {
                const v = validate();
                if (v.message) setErrors((p) => ({ ...p, message: v.message }));
              }}
              aria-invalid={errors.message ? true : undefined}
              aria-describedby={errors.message ? `${uid}-message-error` : `${uid}-message-hint`}
              placeholder="The restaurant, the city, and what bothers you about the website you have now."
              className={`mt-2 resize-y ${FIELD} ${errors.message ? "ring-1 ring-bad" : ""}`}
              style={RADIUS}
            />
            {errors.message ? (
              <p id={`${uid}-message-error`} className="mt-2 text-[0.825rem] text-bad">
                {errors.message}
              </p>
            ) : (
              <p id={`${uid}-message-hint`} className="mt-2 text-[0.825rem] text-ink-3">
                A menu link or your address helps — we look before we answer.
              </p>
            )}
          </div>
        </div>

        {failure && (
          <p
            role="alert"
            className="mt-6 flex gap-2.5 rounded-[var(--r-md)] bg-bad-soft px-4 py-3.5 text-[0.875rem] leading-relaxed text-bad"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden="true"
              className="mt-px shrink-0"
            >
              <circle cx="9" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.6" />
              <path d="M9 5.4v4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <circle cx="9" cy="12.4" r="0.95" fill="currentColor" />
            </svg>
            <span>{failure}</span>
          </p>
        )}

        <div className="mt-7">
          <Button
            type="submit"
            size="lg"
            full
            disabled={pending || !ready}
            aria-busy={pending}
            /* 未 hydrate 那一瞬间按钮不该显示成灰的 —— globals.css 的
               .tap:disabled 是无 layer 规则，类名压不过，只能用内联 style */
            style={!ready ? { opacity: 1, cursor: "default" } : undefined}
          >
            {pending ? (
              <>
                <svg className="spin size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle
                    cx="8"
                    cy="8"
                    r="6.5"
                    stroke="currentColor"
                    strokeOpacity="0.25"
                    strokeWidth="2.2"
                  />
                  <path
                    d="M14.5 8A6.5 6.5 0 0 0 8 1.5"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
                Sending
              </>
            ) : status === "error" ? (
              "Try again"
            ) : (
              "Send message"
            )}
          </Button>
          <p className="mt-3.5 text-center text-[0.8rem] leading-relaxed text-ink-3">
            We use your address to reply, and for nothing else. No list, no newsletter.
          </p>
        </div>

        <p aria-live="polite" className="sr-only">
          {pending ? "Sending your message." : ""}
        </p>
      </form>
    </Card>
  );
}

"use client";

import { useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { Button } from "@/components/button";
import { Card } from "@/components/ui";
import { TIER_BY_ID, formatPrice } from "@/lib/pricing";

type Status = "idle" | "sending" | "sent" | "error";
type Method = "call" | "text" | "email";
type Tier = "launch" | "complete" | "unsure";

/** 输入框圆角走内联 style —— globals.css 的 :focus-visible 会盖掉工具类上的圆角（同 ContactForm） */
const RADIUS = { borderRadius: "var(--r-md)" } as const;
const FIELD =
  "w-full bg-surface-inset px-4 py-3.5 text-[1rem] text-ink placeholder:text-ink-4 " +
  "transition-colors duration-150 focus:bg-surface-2";
const LABEL = "block text-[0.875rem] font-medium text-ink";

const subscribeNothing = () => () => {};

function looksReachable(v: string): boolean {
  const s = v.trim();
  if (s.includes("@")) return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(s);
  return s.replace(/\D/g, "").length >= 7;
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`tap min-h-[44px] rounded-[var(--r-full)] px-4 text-[0.9rem] font-medium ${
        on ? "bg-accent text-accent-ink shadow-float-accent" : "bg-surface-inset text-ink-2 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * 「我想要这个网站」—— 先聊聊，不注册、不付钱。
 *
 * 价格卡要求先注册再付定金，对一封冷邮件来说一步太大（复盘：5 家看到价格区，0 人点）。
 * 这里只要一个能联系上的方式，提交后站长立刻收到通知。
 */
export function InterestForm({ slug, name }: { slug: string; name: string }) {
  const uid = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [contact, setContact] = useState("");
  const [method, setMethod] = useState<Method>("call");
  const [tier, setTier] = useState<Tier>("unsure");
  const [who, setWho] = useState("");
  const [message, setMessage] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);

  // hydrate 之前不可提交：否则会走原生 GET 提交，把联系方式拼进 URL（同 ContactForm）
  const ready = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const pending = status === "sending";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    if (!looksReachable(contact)) {
      setFieldError("Leave a phone number or an email so we can reach you.");
      contactRef.current?.focus();
      return;
    }
    setFieldError(null);
    setFailure(null);
    setStatus("sending");
    try {
      const res = await fetch("/api/interest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug,
          contact: contact.trim(),
          method,
          tier,
          name: who.trim(),
          message: message.trim(),
          website: honeypot.current?.value ?? "",
        }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        setFailure(data?.error ?? "Something broke on our side. Please try again, or email contact@frontcanvas.com.");
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch {
      setFailure("We could not reach the studio. Check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <Card size="lg" className="p-7 md:p-10">
        <div className="rise" role="status">
          <div className="grid size-12 place-items-center rounded-[var(--r-md)] bg-ok-soft">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path d="M5 11.4 9.2 15.5 17 7.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="text-ok" />
            </svg>
          </div>
          <h3 className="display mt-6 text-[1.65rem] text-ink md:text-[1.9rem]">Got it — thank you.</h3>
          <p className="mt-3.5 max-w-[46ch] text-[0.975rem] leading-relaxed text-ink-2">
            Haohua will {method === "email" ? "write" : method === "text" ? "text" : "call"} you within one business day
            to talk through the site for {name} — what you would change, and how the build works. Nothing is charged
            until you decide to go ahead.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card size="lg" className="p-6 md:p-10">
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <div>
          <label htmlFor={`${uid}-contact`} className={LABEL}>
            Best phone number or email
          </label>
          <input
            ref={contactRef}
            id={`${uid}-contact`}
            name="contact"
            type="text"
            inputMode="email"
            autoComplete="tel"
            value={contact}
            onChange={(e) => {
              setContact(e.target.value);
              if (fieldError) setFieldError(null);
            }}
            placeholder="(734) 555-0123 or you@restaurant.com"
            aria-invalid={!!fieldError}
            aria-describedby={fieldError ? `${uid}-contact-err` : undefined}
            className={`${FIELD} mt-2`}
            style={RADIUS}
          />
          {fieldError ? (
            <p id={`${uid}-contact-err`} className="mt-2 text-[0.85rem] text-bad">
              {fieldError}
            </p>
          ) : null}
        </div>

        <fieldset>
          <legend className={LABEL}>How should we reach you?</legend>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Chip on={method === "call"} onClick={() => setMethod("call")}>Call me</Chip>
            <Chip on={method === "text"} onClick={() => setMethod("text")}>Text me</Chip>
            <Chip on={method === "email"} onClick={() => setMethod("email")}>Email me</Chip>
          </div>
        </fieldset>

        <fieldset>
          <legend className={LABEL}>Which one are you leaning toward?</legend>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Chip on={tier === "launch"} onClick={() => setTier("launch")}>Launch — {formatPrice(TIER_BY_ID.launch.amountCents)}</Chip>
            <Chip on={tier === "complete"} onClick={() => setTier("complete")}>Complete, with ordering — {formatPrice(TIER_BY_ID.complete.amountCents)}</Chip>
            <Chip on={tier === "unsure"} onClick={() => setTier("unsure")}>Not sure yet</Chip>
          </div>
        </fieldset>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor={`${uid}-name`} className={LABEL}>
              Your name <span className="font-normal text-ink-3">(optional)</span>
            </label>
            <input
              id={`${uid}-name`}
              name="name"
              type="text"
              autoComplete="name"
              value={who}
              onChange={(e) => setWho(e.target.value)}
              className={`${FIELD} mt-2`}
              style={RADIUS}
            />
          </div>
          <div>
            <label htmlFor={`${uid}-msg`} className={LABEL}>
              Anything you would change first? <span className="font-normal text-ink-3">(optional)</span>
            </label>
            <input
              id={`${uid}-msg`}
              name="message"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Colors, photos, a dish we missed…"
              className={`${FIELD} mt-2`}
              style={RADIUS}
            />
          </div>
        </div>

        {/* 蜜罐：真人看不见也点不到 */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor={`${uid}-website`}>Website</label>
          <input ref={honeypot} id={`${uid}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        {failure ? (
          <p role="alert" className="text-[0.9rem] text-bad">
            {failure}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" variant="primary" size="md" disabled={!ready || pending}>
            {pending ? "Sending…" : "Have someone reach out"}
          </Button>
          <p className="text-[0.85rem] text-ink-3">No account, no payment. A person gets back to you within one business day.</p>
        </div>
      </form>
    </Card>
  );
}

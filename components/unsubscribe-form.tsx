"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/button";

type Phase = "idle" | "gone" | "restored";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

/**
 * 输入框圆角走内联 style —— globals.css 里的 :focus-visible 是无 layer 规则，
 * 会盖掉工具类上的 border-radius，聚焦时圆角会突然缩小。
 */
const RADIUS = { borderRadius: "var(--r-md)" } as const;

const FIELD =
  "w-full bg-surface-inset px-4 py-3.5 text-[0.95rem] text-ink placeholder:text-ink-4 " +
  "transition-colors duration-150 focus:bg-surface-2";

const GENERIC_FAILURE =
  "We could not reach the studio. Check your connection and try again — or email contact@frontcanvas.com and a person will do it by hand.";

function Check() {
  return (
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
  );
}

function Failure({ message }: { message: string }) {
  return (
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
      <span>{message}</span>
    </p>
  );
}

/** 文字型撤销链接 —— 是动作不是导航，所以用 button 元素，只是长得像链接 */
function UndoLink({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap font-medium text-accent underline decoration-accent-line underline-offset-4 hover:text-accent-hover"
    >
      {children}
    </button>
  );
}

/**
 * 退订按钮 / 手动退订表单。
 *
 * 全程乐观更新：点下去**立刻**换成成功态，请求在后台跑。
 * 退订是法定权利，不该让人盯着转圈等服务器；失败了才回滚并说清楚。
 */
export function UnsubscribeForm({
  token,
  maskedEmail,
  linkExpired = false,
}: {
  /** 邮件链接里的 unsub_token。有它就是一键退订，没有就是手输地址。 */
  token?: string;
  /** 打码后的地址，仅用于展示 */
  maskedEmail?: string;
  /** 链接带了 token 但查不到人 —— 这句解释只在还没退订时才有意义 */
  linkExpired?: boolean;
}) {
  const uid = useId();
  const [phase, setPhase] = useState<Phase>("idle");
  const [failure, setFailure] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  /** 已经生效的那个地址：token 模式下是打码值，手输模式下是访客自己刚打的 */
  const [settled, setSettled] = useState<string | null>(maskedEmail ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** 同一地址上的连点：只认最后一次，回滚时不会被过期请求带偏 */
  const seq = useRef(0);

  function send(action: "unsubscribe" | "resubscribe", email: string | null, rollback: Phase) {
    const mine = ++seq.current;

    void (async () => {
      try {
        const res = await fetch("/api/unsubscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(token ? { token, action } : { email, action }),
        });
        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; error?: string }
          | null;

        if (mine !== seq.current) return; // 已被后一次点击接管
        if (!res.ok || !data?.ok) {
          setPhase(rollback);
          setFailure(data?.error ?? GENERIC_FAILURE);
        }
      } catch {
        if (mine !== seq.current) return;
        setPhase(rollback);
        setFailure(GENERIC_FAILURE);
      }
    })();
  }

  /* ── 动作 ─────────────────────────────────────────────── */

  function unsubscribeByToken() {
    setFailure(null);
    setPhase("gone"); // 先变，再发请求
    send("unsubscribe", null, "idle");
  }

  function unsubscribeByEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = typed.trim();

    if (!email) {
      setFieldError("Enter the address you want removed.");
      inputRef.current?.focus();
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setFieldError("That email address does not look right.");
      inputRef.current?.focus();
      return;
    }

    setFieldError(null);
    setFailure(null);
    // 手输模式下回显访客自己刚打的地址 —— 是他自己的输入，无需打码
    setSettled(email);
    setPhase("gone");
    send("unsubscribe", email, "idle");
  }

  function stay() {
    setFailure(null);
    setPhase("restored");
    send("resubscribe", settled, "gone");
  }

  function leaveAgain() {
    setFailure(null);
    setPhase("gone");
    send("unsubscribe", settled, "restored");
  }

  /* ── 撤销后 ───────────────────────────────────────────── */

  if (phase === "restored") {
    return (
      <div className="rise" role="status">
        <h2 className="display text-[1.5rem] text-ink md:text-[1.75rem]">You are still on it.</h2>
        <p className="mt-3.5 max-w-[46ch] text-[0.975rem] leading-relaxed text-ink-2">
          We put {settled ? <strong className="text-ink">{settled}</strong> : "that address"} back.
          Nothing else changed, and you can leave any time.
        </p>
        {failure && <Failure message={failure} />}
        <p className="mt-7 text-[0.9rem] leading-relaxed text-ink-3">
          Changed your mind again? <UndoLink onClick={leaveAgain}>Unsubscribe me</UndoLink>.
        </p>
      </div>
    );
  }

  /* ── 退订成功 ─────────────────────────────────────────── */

  if (phase === "gone") {
    return (
      <div className="rise" role="status">
        <Check />
        <h2 className="display mt-6 text-[1.5rem] text-ink md:text-[1.75rem]">
          Done. We will not write again.
        </h2>
        <p className="mt-3.5 max-w-[48ch] text-[0.975rem] leading-relaxed text-ink-2">
          {settled ? <strong className="text-ink">{settled}</strong> : "That address"} is off our
          list. Anything already queued for it has been cancelled, and the address will not be added
          back — not by a new import, not by a new campaign.
        </p>
        {failure && <Failure message={failure} />}
        <p className="mt-7 text-[0.9rem] leading-relaxed text-ink-3">
          Clicked by accident? <UndoLink onClick={stay}>Actually, I want to stay</UndoLink>.
        </p>
      </div>
    );
  }

  /* ── token 模式：一颗按钮，别的都不问 ─────────────────── */

  if (token) {
    return (
      <div>
        <h2 className="display text-[1.5rem] text-ink md:text-[1.75rem]">
          Stop emails to this address
        </h2>
        <p className="mt-3.5 text-[0.975rem] leading-relaxed text-ink-2">
          This link belongs to{" "}
          <strong className="break-all text-ink">{maskedEmail ?? "your address"}</strong>. One tap
          and we are done — no account, no password, no reason required.
        </p>
        {failure && <Failure message={failure} />}
        <div className="mt-8">
          <Button size="lg" full onClick={unsubscribeByToken}>
            Unsubscribe me
          </Button>
        </div>
      </div>
    );
  }

  /* ── 手动模式：没 token 也必须能退 ────────────────────── */

  return (
    <div>
      <h2 className="display text-[1.5rem] text-ink md:text-[1.75rem]">
        Take my address off the list
      </h2>
      <p className="mt-3.5 text-[0.975rem] leading-relaxed text-ink-2">
        Type the address our email arrived at. That is the only thing we need, and the only thing we
        will ask for.
      </p>

      <form onSubmit={unsubscribeByEmail} noValidate className="mt-8">
        <label htmlFor={`${uid}-email`} className="block text-[0.875rem] font-medium text-ink">
          Email address
        </label>
        <input
          ref={inputRef}
          id={`${uid}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={200}
          required
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value);
            if (fieldError) setFieldError(null);
          }}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? `${uid}-email-error` : undefined}
          placeholder="you@yourrestaurant.com"
          className={`mt-2 ${FIELD} ${fieldError ? "ring-1 ring-bad" : ""}`}
          style={RADIUS}
        />
        {fieldError && (
          <p id={`${uid}-email-error`} className="mt-2 text-[0.825rem] text-bad">
            {fieldError}
          </p>
        )}

        {failure && <Failure message={failure} />}

        <div className="mt-7">
          <Button type="submit" size="lg" full>
            Unsubscribe me
          </Button>
        </div>
      </form>

      {linkExpired && (
        <p className="mt-7 border-t border-line pt-6 text-[0.875rem] leading-relaxed text-ink-3">
          The link you followed has expired or was altered on its way here, so we could not tell
          which address it belonged to. Typing it above does exactly the same thing.
        </p>
      )}
    </div>
  );
}

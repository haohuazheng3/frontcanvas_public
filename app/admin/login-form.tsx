"use client";

import { useActionState } from "react";

import { loginAction, type LoginState } from "./actions";

const initial: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="mt-8">
      <label
        htmlFor="admin-password"
        className="block text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink-3"
      >
        口令
      </label>
      <div className="mt-2.5 flex gap-2.5">
        <input
          id="admin-password"
          name="password"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          autoFocus
          required
          className="w-full min-w-0 rounded-[var(--r-md)] bg-surface-inset px-4 py-3 font-mono text-[1rem] text-ink outline-none ring-accent/40 placeholder:text-ink-3 focus:ring-2"
          placeholder="······"
        />
        <button
          type="submit"
          disabled={pending}
          className="tap shrink-0 rounded-[var(--r-md)] bg-accent px-5 py-3 text-[0.9rem] font-semibold text-accent-ink shadow-float-accent disabled:opacity-60"
        >
          {pending ? "验证中…" : "进入"}
        </button>
      </div>
      <p aria-live="polite" className="mt-3 min-h-[1.2rem] text-[0.85rem] text-bad">
        {state.error ?? ""}
      </p>
    </form>
  );
}

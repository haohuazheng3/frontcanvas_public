import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Enter your email and we will send you a code. No password to remember.",
  robots: { index: false, follow: false },
};

/**
 * 注册与登录是同一个入口。
 * 用户只输邮箱：没注册过的自动建号并发码，注册过的直接发码登录。
 * 界面上不存在「注册 / 登录」两个分岔 —— 永远只有「输邮箱 → 收码 → 进站」三步。
 */
export default function SignInPage() {
  return (
    <div className="shell flex min-h-[78svh] flex-col items-center justify-center py-14">
      <div className="mb-8 text-center">
        <Logo size={30} />
        <h1 className="display mt-6 text-[2rem] leading-tight text-ink">
          Enter your email
        </h1>
        <p className="mx-auto mt-3 max-w-[34ch] text-[0.95rem] leading-relaxed text-ink-2">
          We will send you a six-digit code. There is no password to create or remember.
        </p>
      </div>

      <SignIn
        withSignUp
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-in"
        fallbackRedirectUrl="/account"
        appearance={{
          elements: {
            rootBox: "w-full flex justify-center",
            cardBox: "shadow-float-lg rounded-[var(--r-xl)] overflow-hidden",
            card: "bg-surface shadow-none",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            footer: "bg-surface",
            formButtonPrimary:
              "bg-accent hover:bg-accent-hover text-accent-ink normal-case font-semibold shadow-float-accent",
            formFieldInput: "bg-surface-inset border-line rounded-[var(--r-sm)]",
            dividerRow: "hidden",
            socialButtonsBlockButton: "hidden",
          },
        }}
      />

      <p className="mt-8 max-w-[38ch] text-center text-[0.8rem] leading-relaxed text-ink-3">
        By continuing you agree to our{" "}
        <a href="/terms" className="text-accent hover:text-accent-hover">Terms</a> and{" "}
        <a href="/privacy" className="text-accent hover:text-accent-hover">Privacy Policy</a>.
      </p>
    </div>
  );
}

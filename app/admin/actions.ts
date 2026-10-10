"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_COOKIE, passwordMatches } from "@/lib/admin";

export interface LoginState {
  error: string | null;
}

/**
 * 登录：口令对上就把 ADMIN_SECRET 写进 HttpOnly cookie。
 * 口令本身不进 cookie、不进日志 —— 它只在这一次比较里出现。
 */
export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");

  if (!passwordMatches(password)) {
    // 平一拍再回错误：让穷举一个 6 位口令从「秒级」变成「按天算」，
    // 而真人多等半秒无感
    await new Promise((r) => setTimeout(r, 700));
    return { error: "口令不对。" };
  }

  const secret = process.env.ADMIN_SECRET;
  if (!secret) return { error: "服务端没配 ADMIN_SECRET，后台等于不存在。" };

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,   // 30 天，够一轮出差
  });
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect("/admin");
}

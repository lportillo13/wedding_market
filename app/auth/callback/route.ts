// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next");
  const next = requestedNext?.startsWith("/")
    && !requestedNext.startsWith("//")
    && !requestedNext.includes("\\")
    ? requestedNext
    : "/";
  const res = NextResponse.redirect(new URL(next, requestUrl.origin));
  if (!code) return res;

  const cookieStore = await cookies(); // Next 15: await
  const isProd = process.env.NODE_ENV === "production";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          const sameSite = options?.sameSite ?? "lax";
          res.cookies.set({
            name,
            value,
            ...options,
            path: options?.path ?? "/",
            sameSite: sameSite,
            secure: isProd, // ⬅️ critical on localhost
          });
        },
        remove(name: string, options: CookieOptions) {
          const sameSite = options?.sameSite ?? "lax";
          res.cookies.set({
            name,
            value: "",
            ...options,
            path: options?.path ?? "/",
            sameSite,
            secure: isProd,
            maxAge: 0,
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const fallbackPath = next === "/reset-password"
      ? "/forgot-password?error=recovery"
      : "/login?error=auth_callback";
    return NextResponse.redirect(new URL(fallbackPath, requestUrl.origin));
  }
  return res;
}

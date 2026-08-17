import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function safeNextPath(requestedNext: string | null, type: EmailOtpType | null) {
  if (
    requestedNext?.startsWith("/")
    && !requestedNext.startsWith("//")
    && !requestedNext.includes("\\")
  ) {
    return requestedNext;
  }

  return type === "recovery" ? "/reset-password" : "/";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(requestUrl.searchParams.get("next"), type);
  const fallbackPath = type === "recovery"
    ? "/forgot-password?error=recovery"
    : "/login?error=auth_callback";

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL(fallbackPath, requestUrl.origin));
  }

  const response = NextResponse.redirect(new URL(next, requestUrl.origin));
  const cookieStore = await cookies();
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
          response.cookies.set({
            name,
            value,
            ...options,
            path: options.path ?? "/",
            sameSite: options.sameSite ?? "lax",
            secure: isProd,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: "",
            ...options,
            path: options.path ?? "/",
            sameSite: options.sameSite ?? "lax",
            secure: isProd,
            maxAge: 0,
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(new URL(fallbackPath, requestUrl.origin));
  }

  return response;
}

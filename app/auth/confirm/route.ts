import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authCallbackFailurePath, authRedirectUrl, safeAuthNextPath } from '@/lib/auth-redirect';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = safeAuthNextPath(requestUrl.searchParams.get("next"), type === 'recovery' ? '/reset-password' : '/');
  const fallbackPath = authCallbackFailurePath(type === 'recovery' && !next.startsWith('/reset-password') ? '/reset-password' : next);

  if (!tokenHash || !type) {
    return NextResponse.redirect(authRedirectUrl(fallbackPath));
  }

  const response = NextResponse.redirect(authRedirectUrl(next));
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
    return NextResponse.redirect(authRedirectUrl(fallbackPath));
  }

  return response;
}

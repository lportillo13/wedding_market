// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { authCallbackFailurePath, authRedirectUrl, safeAuthNextPath } from '@/lib/auth-redirect';
import {resolveLoginDestination} from '@/features/auth/domain/login-destination';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeAuthNextPath(requestUrl.searchParams.get("next"), '/account/profile');
  const res = NextResponse.redirect(authRedirectUrl(next));
  if (!code) return NextResponse.redirect(authRedirectUrl(authCallbackFailurePath(next)));

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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(authRedirectUrl(authCallbackFailurePath(next)));
  }
  const destination = await resolveLoginDestination(
    {nextPath: next, defaultWorkspace: !requestUrl.searchParams.has('next'), userId: data.user?.id},
    async userId => {
      const {data: isVendor} = await supabase.rpc('is_vendor', {_uid: userId});
      return Boolean(isVendor);
    },
  );
  res.headers.set('Location', authRedirectUrl(destination).href);
  return res;
}

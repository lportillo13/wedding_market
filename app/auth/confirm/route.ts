import {createSupabaseResponseClient} from '@/lib/supabase/response';
import type { EmailOtpType } from "@supabase/supabase-js";
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

  const supabase = await createSupabaseResponseClient(response);

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    response.headers.set("Location", authRedirectUrl(fallbackPath).href);
    return response;
  }

  return response;
}

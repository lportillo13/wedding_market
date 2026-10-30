// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import {createSupabaseResponseClient} from '@/lib/supabase/response';
import { authCallbackFailurePath, authRedirectUrl, safeAuthNextPath } from '@/lib/auth-redirect';
import {resolveLoginDestination} from '@/features/auth/domain/login-destination';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeAuthNextPath(requestUrl.searchParams.get("next"), '/account/profile');
  const res = NextResponse.redirect(authRedirectUrl(next));
  if (!code) return NextResponse.redirect(authRedirectUrl(authCallbackFailurePath(next)));


  const supabase = await createSupabaseResponseClient(res);

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    res.headers.set("Location", authRedirectUrl(authCallbackFailurePath(next)).href);
    return res;
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

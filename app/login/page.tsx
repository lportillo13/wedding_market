// app/login/page.tsx
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import LoginClient from "./LoginClient";
import { safeAuthNextPath } from "@/lib/auth-redirect";
import {accessContinuation,accessRequest} from '@/features/auth/domain/access';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; intent?:string; password_updated?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const access=accessRequest(sp.next,sp.intent);
  let nextPath = safeAuthNextPath(sp.next ?? null, "/account/profile");
  if(nextPath.startsWith('/auth/continue?'))nextPath=accessContinuation(access.intent,access.next,access.defaultWorkspace);

  if (user && !sp?.next) {
    const { data: isVendor } = await supabase.rpc("is_vendor", { _uid: user.id });
    nextPath = isVendor ? "/vendor/profile" : "/account/profile";
  }

  // If already logged in, go straight to target
  if (user) redirect(nextPath);

  return <LoginClient intent={access.intent} nextPath={access.next} defaultWorkspace={!sp.next||access.defaultWorkspace} passwordUpdated={sp.password_updated === "1"} callbackError={sp.error === "auth_callback"} />;
}

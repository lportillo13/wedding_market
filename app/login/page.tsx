// app/login/page.tsx
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import LoginClient from "./LoginClient";
import {accessContinuation,accessDestination,accessRequest} from '@/features/auth/domain/access';
import {loadAccessAccount} from '@/features/auth/server/access-account';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; intent?:string; password_updated?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await getSupabaseServer();
  const access=accessRequest(sp.next,sp.intent);
  const defaultWorkspace=!sp.next||Boolean(access.defaultWorkspace);
  const account=await loadAccessAccount(supabase);
  if(account.status==='ready')redirect(accessDestination(account.profile,account.isVendor,access.intent,access.next,defaultWorkspace));
  if(account.status==='unavailable')redirect(accessContinuation(access.intent,access.next,defaultWorkspace));

  return <LoginClient intent={access.intent} nextPath={access.next} defaultWorkspace={defaultWorkspace} passwordUpdated={sp.password_updated === "1"} callbackError={sp.error === "auth_callback"} />;
}

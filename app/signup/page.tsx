import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import SignUpPageContent from './SignUpPageContent';
import {loadAccessAccount} from '@/features/auth/server/access-account';
import {accessContinuation,accessReturnPath,coupleSetupComplete} from '@/features/auth/domain/access';

export default async function SignUpPage({
  searchParams,
}: {
  searchParams?: Promise<{ modal?: string;complete?:string;next?:string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;
  const next=accessReturnPath(params?.next),account=await loadAccessAccount(supabase);
  if(account.status==='unavailable')redirect(accessContinuation('couple',next));
  if(account.status==='ready'){
    if(account.isVendor)redirect('/vendor/profile');
    if(account.profile.role!=='user'||coupleSetupComplete(account.profile))redirect(next);
    const p=account.profile;
    return <SignUpPageContent nextPath={next} verifiedAccount={{full_name:p.full_name||'',email:account.user.email||'',phone:p.phone||'',country:p.country||'',wedding_theme:p.wedding_theme||'',tentative_wedding_date:p.tentative_wedding_date||'',guest_count:p.guest_count===null||p.guest_count===undefined?'':String(p.guest_count),wedding_budget:p.wedding_budget===null||p.wedding_budget===undefined?'':String(p.wedding_budget)}}/>;
  }

  const openModalOnLoad = params?.modal === 'create-account';

  return <SignUpPageContent closeHref={openModalOnLoad ? '/login' : undefined} openModalOnLoad={openModalOnLoad} />;
}

import Link from 'next/link';
import {redirect} from 'next/navigation';
import EditorialAuthLayout from '@/components/auth/EditorialAuthLayout';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {getRequestI18n} from '@/lib/i18n/server';
import {loadAccessAccount} from '@/features/auth/server/access-account';
import {accessContinuation,accessReturnPath,coupleSetupComplete} from '@/features/auth/domain/access';
import {accessCopy} from '@/features/auth/presentation/access-copy';
export default async function Page({searchParams}:{searchParams:Promise<{next?:string}>}) {
  const next=accessReturnPath((await searchParams).next),account=await loadAccessAccount(await createSupabaseServerClient());
  if(account.status==='guest')redirect('/login?'+new URLSearchParams({next:accessContinuation('login',next)}));
  if(account.status!=='ready')redirect(accessContinuation('login',next));
  if(account.isVendor)redirect('/vendor/profile');
  if(account.profile.role!=='user'||coupleSetupComplete(account.profile))redirect(next);
  const {language}=await getRequestI18n(),copy=accessCopy[language];
  return <EditorialAuthLayout><header className="wm-auth-editorial__heading"><h1>{copy.chooseTitle}</h1><p>{copy.chooseBody}</p></header><div className="d-grid gap-3"><Link className="wm-auth-btn" href={'/signup?complete=1&'+new URLSearchParams({next})}>{copy.couple}</Link><Link className="wm-auth-btn wm-auth-btn--ghost" href="/signup/vendor">{copy.vendor}</Link><Link className="wm-auth-text-link" href="/account/profile">{copy.later}</Link></div></EditorialAuthLayout>;
}

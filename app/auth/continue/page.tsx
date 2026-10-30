import Link from 'next/link';
import {redirect} from 'next/navigation';
import EditorialAuthLayout from '@/components/auth/EditorialAuthLayout';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {getRequestI18n} from '@/lib/i18n/server';
import {loadAccessAccount} from '@/features/auth/server/access-account';
import {accessContinuation,accessDestination,accessIntent,accessReturnPath} from '@/features/auth/domain/access';
import {accessCopy} from '@/features/auth/presentation/access-copy';

export default async function Page({searchParams}:{searchParams:Promise<{intent?:string;next?:string;workspace?:string}>}) {
  const params=await searchParams,intent=accessIntent(params.intent),next=accessReturnPath(params.next);
  const account=await loadAccessAccount(await createSupabaseServerClient());
  if(account.status==='guest')redirect('/login?'+new URLSearchParams({next:accessContinuation(intent,next,params.workspace==='1')}));
  if(account.status==='ready')redirect(accessDestination(account.profile,account.isVendor,intent,next,params.workspace==='1'));
  const {language}=await getRequestI18n(),copy=accessCopy[language];
  return <EditorialAuthLayout><header className="wm-auth-editorial__heading"><h1>{copy.accessError}</h1></header><Link className="wm-auth-btn" href={accessContinuation(intent,next,params.workspace==='1')}>{copy.retry}</Link></EditorialAuthLayout>;
}

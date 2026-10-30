import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {loadAccessAccount} from '@/features/auth/server/access-account';
import {accessContinuation} from '@/features/auth/domain/access';
import {resolveVendorOwnerName} from '@/features/auth/domain/vendor-onboarding';
import VendorSignupPageContent from './VendorSignupPageContent';

type CategoryOption = {
  key: string;
  label: Record<string, unknown> | null;
};

export default async function VendorSignupPage() {
  const supabase = await createSupabaseServerClient();
  const account=await loadAccessAccount(supabase);
  if(account.status==='unavailable')redirect(accessContinuation('vendor','/signup/vendor'));

  if (account.status==='ready'&&account.isVendor) {
    redirect('/vendor');
  }

  const { data } = await supabase
    .from('categories')
    .select('key, label')
    .order('key', { ascending: true });

  return <VendorSignupPageContent categories={(data ?? []) as CategoryOption[]} requiresAccount={account.status!=='ready'} initialOwnerName={account.status==='ready'?resolveVendorOwnerName(null,account.profile.full_name):''}/>;
}

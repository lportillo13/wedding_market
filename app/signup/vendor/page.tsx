import { redirect } from 'next/navigation';
import { getRoles } from '@/lib/auth/roles';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import VendorSignupPageContent from './VendorSignupPageContent';

type CategoryOption = {
  key: string;
  label: Record<string, unknown> | null;
};

export default async function VendorSignupPage() {
  const { user, isVendor } = await getRoles();

  if (isVendor) {
    redirect('/vendor');
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('categories')
    .select('key, label')
    .order('key', { ascending: true });

  return <VendorSignupPageContent categories={(data ?? []) as CategoryOption[]} requiresAccount={!user} />;
}

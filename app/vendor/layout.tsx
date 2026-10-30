import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getRoles } from '@/lib/auth/roles';
import VendorDashboardHeader from './VendorDashboardHeader';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {VendorWorkspaceProvider} from './VendorWorkspaceContext';

export default async function VendorLayout({ children }: { children: ReactNode }) {
  const { user, isVendor } = await getRoles();

  if (!user || !isVendor) {
    redirect('/signup/vendor');
  }

  const supabase = await createSupabaseServerClient();
  const {data: vendor, error} = await supabase.from('vendors').select('id,business_name,slug,is_published').eq('owner_id', user.id).maybeSingle();
  if (error) throw new Error('Unable to load your business workspace. Please try again.');
  const [categoriesResult, boutiqueResult] = vendor ? await Promise.all([
    supabase.from('vendor_categories').select('category:categories(key)').eq('vendor_id', vendor.id).returns<{category:{key:string}|null}[]>(),
    supabase.from('boutiques').select('vendor_id').eq('vendor_id', vendor.id).maybeSingle(),
  ]) : [{data:[],error:null}, {data:null,error:null}];
  if (categoriesResult.error || boutiqueResult.error) throw new Error('Unable to load your business workspace. Please try again.');
  const hasBoutique = Boolean(boutiqueResult.data) || (categoriesResult.data ?? []).some(row => /(?:dress|suit|tux|attire|bridal_wear|boutique)/i.test(row.category?.key ?? ''));
  const summary = {businessName:vendor?.business_name ?? '', slug:vendor?.slug ?? '', isPublished:vendor?.is_published ?? false, hasBoutique};

  return (
    <VendorWorkspaceProvider key={user.id} summary={summary}>
    <div className="wm-vendor-workspace wm-vendor-studio">
      <VendorDashboardHeader />
      <div className="wm-studio-content">{children}</div>
    </div>
    </VendorWorkspaceProvider>
  );
}

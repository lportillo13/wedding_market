export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';
import { getRoles } from '@/lib/auth/roles';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import ProfileForm from './profileForm';

type VendorRow = {
  slug: string | null;
  business_name: string | null;
  bio: { en?: string | null; es?: string | null } | null;
};

export default async function ProfilePage() {
  const { user, isVendor } = await getRoles();
  if (!user || !isVendor) redirect('/signup/vendor');

  const supabase = await createSupabaseServerClient();

  let { data: vendor } = await supabase
    .from('vendors')
    .select('id, slug, business_name, bio')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!vendor) {
    const inserted = await supabase
      .from('vendors')
      .insert({
        owner_id: user.id,
        slug: `vendor-${user.id.slice(0, 8)}`,
        business_name: 'Untitled Vendor',
        bio: { en: '', es: '' },
        is_published: false,
      })
      .select('id, slug, business_name, bio')
      .single();

    if (inserted.error) {
      throw new Error(inserted.error.message);
    }

    vendor = inserted.data ?? null;
  }

  const v = vendor as VendorRow | null;
  const bio = v?.bio ?? null;
  const initial = {
    slug: v?.slug ?? '',
    business_name: v?.business_name ?? '',
    bio_en: bio?.en ?? '',
    bio_es: bio?.es ?? '',
  };

  return (
    <div className="row">
      <div className="col-lg-8">
        <ProfileForm initial={initial} />
      </div>
    </div>
  );
}

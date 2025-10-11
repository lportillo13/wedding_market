export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';
import { getRoles } from '@/lib/auth/roles';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PublishSection from './PublishSection';

export default async function PublishPage() {
  const { user, isVendor } = await getRoles();
  if (!user || !isVendor) redirect('/signup/vendor');

  const supabase = await createSupabaseServerClient();

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, slug, business_name, is_published')
    .eq('owner_id', user.id)
    .maybeSingle();

  const initial = {
    is_published: vendor?.is_published ?? false,
    slug: vendor?.slug ?? undefined,
  };

  return (
    <div className="row">
      <div className="col-lg-8">
        <PublishSection initial={initial} />
      </div>
    </div>
  );
}

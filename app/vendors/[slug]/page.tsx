// app/vendors/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Reviews from './Reviews';
import VendorProfileContent from './VendorProfileContent';
import type { VendorProfile, VendorRating } from './types';

export default async function VendorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // ✅ Next 15: await params

  const supabase = await createSupabaseServerClient();
  const { data: vendor, error } = await supabase
    .from('vendor_public_search')
    .select('*')
    .eq('slug', slug)
    .maybeSingle<VendorProfile>();

  if (error) {
    throw new Error(error.message);
  }
  if (!vendor) {
    notFound();
  }

  const { data: rating } = await supabase
    .from('vendor_ratings')
    .select('rating_avg, rating_count')
    .eq('vendor_id', vendor.id)
    .maybeSingle<VendorRating>();

  const avg = Number(rating?.rating_avg ?? 0);
  const count = Number(rating?.rating_count ?? 0);

  const { data: { user } } = await supabase.auth.getUser();

  let reviewRfqId: string | null = null;
  if (user) {
    const { data: rfqId } = await supabase.rpc('first_eligible_review_rfq', {
      _uid: user.id,
      _vendor_id: vendor.id,
    });

    reviewRfqId = rfqId ?? null;
  }

  return (
    <VendorProfileContent
      vendor={vendor}
      averageRating={avg}
      ratingCount={count}
      reviewRfqId={reviewRfqId}
    >
      <Reviews vendorId={vendor.id} />
    </VendorProfileContent>
  );
}

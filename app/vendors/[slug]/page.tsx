// app/vendors/[slug]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ShortlistButton from '@/components/shortlist/ShortlistButton';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Stars } from '@/components/Stars';
import Reviews from './Reviews';

type Vendor = {
  id: string;
  slug: string;
  business_name: string;
  bio_en: string | null;
  bio_es: string | null;
  categories: string[] | null;
  created_at: string;
  is_published: boolean;
};

type VendorRating = {
  rating_avg: number | null;
  rating_count: number | null;
};

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
    .maybeSingle<Vendor>();

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
    <main className="container py-4" style={{ maxWidth: 960 }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="mb-0">{vendor.business_name}</h1>
        <ShortlistButton vendorId={vendor.id} />
      </div>

      {vendor.categories?.length ? (
        <div className="mb-2 small text-secondary">
          {vendor.categories.join(' • ')}
        </div>
      ) : null}

      <div className="d-flex align-items-center gap-2 my-3">
        <Stars value={avg} />
        <span className="text-muted">({count})</span>
      </div>

      {reviewRfqId && (
        <div className="my-3">
          <Link className="btn btn-primary" href={`/account/reviews/new/${reviewRfqId}`}>
            Write a review
          </Link>
        </div>
      )}

      {vendor.bio_en ? <p className="lead">{vendor.bio_en}</p> : null}

      <hr className="my-4" />

      <Reviews vendorId={vendor.id} />

      <div className="alert alert-info mt-4">
        More details (gallery, FAQs, coupons) coming soon.
      </div>
    </main>
  );
}

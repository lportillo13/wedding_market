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
    const { data: rfqs } = await supabase
      .from('rfqs')
      .select(`
        id,
        owner_id,
        accepted_quote_id,
        quotes:quotes!rfqs_accepted_quote_id_fkey(vendor_id)
      `)
      .eq('owner_id', user.id)
      .not('accepted_quote_id', 'is', null)
      .limit(20);

    if (Array.isArray(rfqs)) {
      for (const rfq of rfqs) {
        type VendorQuoteRow = { vendor_id: string | null };
        const rfqWithQuotes = rfq as typeof rfq & { quotes?: VendorQuoteRow[] | null };
        const vendorIdFromQuote = Array.isArray(rfqWithQuotes.quotes)
          ? rfqWithQuotes.quotes?.[0]?.vendor_id ?? null
          : null;

        if (vendorIdFromQuote !== vendor.id) {
          continue;
        }

        const { count: existingCount } = await supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('author_id', user.id)
          .eq('vendor_id', vendor.id)
          .eq('rfq_id', rfq.id);

        if ((existingCount ?? 0) > 0) {
          continue;
        }

        const { data: canReview } = await supabase
          .rpc('can_user_review', { _uid: user.id, _vendor_id: vendor.id, _rfq_id: rfq.id });

        if (canReview) {
          reviewRfqId = rfq.id;
          break;
        }
      }
    }
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
          <Link
            className="btn btn-outline-primary"
            href={`/account/reviews/new/${reviewRfqId}`}
            aria-label="Write a review for this vendor"
          >
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

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createReview, type CreateReviewState } from '@/app/account/reviews/actions';
import ReviewForm from './ReviewForm';

type RfqWithAcceptedVendor = {
  id: string;
  accepted_quote_id: string | null;
  quotes: { vendor_id: string }[] | null;
};

export default async function NewReviewPage({
  params,
}: {
  params: Promise<{ rfq_id: string }>;
}) {
  const { rfq_id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('rfqs')
    .select('id, accepted_quote_id, quotes:quotes!rfqs_accepted_quote_id_fkey(vendor_id)')
    .eq('id', rfq_id)
    .maybeSingle<RfqWithAcceptedVendor>();

  if (error) throw new Error(error.message);

  const vendorId = data?.quotes?.[0]?.vendor_id ?? null;

  if (!vendorId) {
    return <p>You can only review vendors you hired.</p>;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <p>You can only review vendors you hired.</p>;
  }

  const { data: allowed } = await supabase.rpc('can_user_review', {
    _uid: user.id,
    _vendor_id: vendorId,
    _rfq_id: rfq_id,
  });
  const { data: done } = await supabase.rpc('has_user_reviewed', {
    _uid: user.id,
    _vendor_id: vendorId,
    _rfq_id: rfq_id,
  });
  const hasReviewed = !!done;
  const canWrite = !!allowed && !hasReviewed;

  if (!canWrite) {
    return <p>You can only review vendors you hired.</p>;
  }

  async function action(prev: CreateReviewState, fd: FormData): Promise<CreateReviewState> {
    const res = await createReview(prev, fd);
    if (res.ok) {
      revalidatePath('/vendors');
    }
    return res;
  }

  return (
    <main className="container py-4" style={{ maxWidth: 720 }}>
      <h1 className="mb-3">Write a review</h1>
      <ReviewForm rfq_id={rfq_id} vendor_id={vendorId} action={action} />
    </main>
  );
}

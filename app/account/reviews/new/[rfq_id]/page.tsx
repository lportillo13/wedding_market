import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createReview, type CreateReviewState } from '@/app/account/reviews/actions';
import ReviewForm from './ReviewForm';

type RfqWithAcceptedVendor = {
  id: string;
  accepted_quote_id: string | null;
  quotes: { vendor_id: string }[] | null;
};

export default async function NewReviewPage({ params }: { params: { rfq_id: string } }) {
  const { rfq_id } = params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('rfqs')
    .select('id, accepted_quote_id, quotes:quotes!rfqs_accepted_quote_id_fkey(vendor_id)')
    .eq('id', rfq_id)
    .maybeSingle<RfqWithAcceptedVendor>();

  if (error) throw new Error(error.message);

  const vendorId = data?.quotes?.[0]?.vendor_id ?? null;

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
      {vendorId ? (
        <ReviewForm rfq_id={rfq_id} vendor_id={vendorId} action={action} />
      ) : (
        <div className="alert alert-danger">You can only review vendors you hired.</div>
      )}
    </main>
  );
}

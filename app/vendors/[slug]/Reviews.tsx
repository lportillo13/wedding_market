import { createSupabaseServerClient } from '@/lib/supabase/server';

type PublicReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
};

export default async function Reviews({ vendorId }: { vendorId: string }) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('reviews_public')
    .select('id, rating, title, body, created_at')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
    .limit(12)
    .returns<PublicReview[]>();

  if (error) return null;
  if (!data?.length) return <p className="text-muted">No reviews yet.</p>;

  return (
    <div className="vstack gap-3">
      {data.map((review) => (
        <article key={review.id} className="border rounded p-3">
          <div className="d-flex gap-2 align-items-center mb-2">
            <span className="badge text-bg-success">{review.rating}/5</span>
            <time className="text-muted small">{new Date(review.created_at).toLocaleDateString()}</time>
          </div>
          {review.title ? <h6 className="mb-2">{review.title}</h6> : null}
          {review.body ? <p className="mb-0">{review.body}</p> : null}
          <div className="text-muted small mt-2">Verified client</div>
        </article>
      ))}
    </div>
  );
}

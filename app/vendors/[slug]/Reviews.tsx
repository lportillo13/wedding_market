import { getSupabaseServer } from "@/lib/supabase/server";

export default async function ReviewsList({ vendor_id }: { vendor_id: string }) {
  const supabase = await getSupabaseServer();
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("id, stars, title, body, created_at")
    .eq("vendor_id", vendor_id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);

  if (!reviews?.length) return null;

  return (
    <section className="mt-4">
      <h5 className="mb-3">Recent reviews</h5>
      <div className="vstack gap-3">
        {reviews.map(r => (
          <div className="border rounded p-3" key={r.id}>
            <div className="d-flex justify-content-between">
              <div className="fs-6">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</div>
              <div className="small text-secondary">{new Date(r.created_at!).toLocaleDateString()}</div>
            </div>
            {r.title && <div className="fw-semibold mt-1">{r.title}</div>}
            {r.body && <div className="mt-1">{r.body}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

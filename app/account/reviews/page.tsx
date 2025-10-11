import { getSupabaseServer } from "@/lib/supabase/server";

export default async function MyReviewsPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="container py-4" style={{ maxWidth: 960 }}>
        <div className="alert alert-warning">Please log in to see your reviews.</div>
        <a className="btn btn-primary" href="/login?next=/account/reviews">Log in</a>
      </main>
    );
  }

  const { data: rows, error } = await supabase
    .from("reviews")
    .select("id, rfq_id, vendor_id, stars, title, created_at")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (
    <main className="container py-4" style={{ maxWidth: 960 }}>
      <h1 className="mb-3">My reviews</h1>
      {!rows?.length ? (
        <div className="alert alert-secondary">You haven’t written any reviews yet.</div>
      ) : (
        <div className="vstack gap-3">
          {rows.map(r => (
            <div className="card" key={r.id}>
              <div className="card-body">
                <div className="d-flex justify-content-between">
                  <div>
                    <div className="fw-semibold">RFQ {r.rfq_id.slice(0, 8)}…</div>
                    <div className="small text-secondary">{new Date(r.created_at!).toLocaleString()}</div>
                  </div>
                  <div className="fs-5">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</div>
                </div>
                {r.title && <div className="mt-2">{r.title}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

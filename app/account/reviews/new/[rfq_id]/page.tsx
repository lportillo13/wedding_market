import { getSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import { createReview } from "../../actions";

export default async function NewReviewPage({ params }: { params: Promise<{ rfq_id: string }> }) {
  const { rfq_id } = await params;
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="container py-4" style={{ maxWidth: 720 }}>
        <div className="alert alert-warning">Please log in.</div>
        <a className="btn btn-primary" href={`/login?next=${encodeURIComponent(`/account/reviews/new/${rfq_id}`)}`}>Log in</a>
      </main>
    );
  }

  // Load RFQ + accepted vendor
  const { data: rfq, error } = await supabase
    .from("rfqs")
    .select("id, owner_id, accepted_quote_id")
    .eq("id", rfq_id)
    .maybeSingle();
  if (error) throw new Error(error.message);

  if (!rfq || rfq.owner_id !== user.id || !rfq.accepted_quote_id) {
    return (
      <main className="container py-4" style={{ maxWidth: 720 }}>
        <div className="alert alert-danger">You can only review after hiring a vendor for this RFQ.</div>
      </main>
    );
  }

  // Resolve vendor_id from accepted quote
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, vendor_id")
    .eq("id", rfq.accepted_quote_id!)
    .maybeSingle();

  if (!quote) {
    return (
      <main className="container py-4" style={{ maxWidth: 720 }}>
        <div className="alert alert-danger">Accepted quote not found.</div>
      </main>
    );
  }

  async function actionWrapper(fd: FormData): Promise<void> {
    const res = await createReview(fd);
    if (!res.ok) {
      throw new Error(res.message ?? "Failed to submit review.");
    }

    redirect("/account/reviews");
  }

  return (
    <main className="container py-4" style={{ maxWidth: 720 }}>
      <h1 className="mb-3">Write a review</h1>
      <form action={actionWrapper} className="vstack gap-3">
        <input type="hidden" name="rfq_id" value={rfq_id} />
        <input type="hidden" name="vendor_id" value={quote.vendor_id} />

        <div>
          <label className="form-label" htmlFor="review-stars">Rating</label>
          <select id="review-stars" name="stars" className="form-select" defaultValue="5" required>
            <option value="5">★★★★★</option>
            <option value="4">★★★★☆</option>
            <option value="3">★★★☆☆</option>
            <option value="2">★★☆☆☆</option>
            <option value="1">★☆☆☆☆</option>
          </select>
        </div>

        <div>
          <label className="form-label" htmlFor="review-title">Title (optional)</label>
          <input id="review-title" name="title" className="form-control" maxLength={120} />
        </div>

        <div>
          <label className="form-label" htmlFor="review-body">Your experience (optional)</label>
          <textarea id="review-body" name="body" className="form-control" rows={5} />
        </div>

        <button className="btn btn-primary">Submit review</button>
      </form>
    </main>
  );
}

import { getSupabaseServer } from "@/lib/supabase/server";
import AcceptButton from "./AcceptButton";

export default async function RfqDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="container py-4" style={{ maxWidth: 960 }}>
        <div className="alert alert-warning">Please log in to view this RFQ.</div>
        <a className="btn btn-primary" href={`/login?next=${encodeURIComponent(`/account/rfqs/${id}`)}`}>
          Log in
        </a>
      </main>
    );
  }

  const { data: rfq, error: rfqErr } = await supabase
    .from("rfqs")
    .select(`
      id, owner_id, event_date, guest_count, budget_min, budget_max,
      city, state, country, language, theme, notes,
      created_at, accepted_quote_id, accepted_at
    `)
    .eq("id", id)
    .maybeSingle();
  if (rfqErr) throw new Error(rfqErr.message);
  if (!rfq) {
    return (
      <main className="container py-4" style={{ maxWidth: 960 }}>
        <div className="alert alert-danger">RFQ not found.</div>
      </main>
    );
  }

  const isOwner = rfq.owner_id === user.id;
  const accepted = Boolean(rfq.accepted_quote_id);

  const { data: quotes, error: qErr } = await supabase
    .from("quotes")
    .select("id, vendor_id, amount_cents, currency, message, created_at")
    .eq("rfq_id", rfq.id)
    .order("created_at", { ascending: false });
  if (qErr) throw new Error(qErr.message);

  const vendorIds = Array.from(new Set((quotes ?? []).map(q => q.vendor_id)));
  let vendorsById = new Map<string, { id: string; slug: string | null; business_name: string }>();
  if (vendorIds.length) {
    const { data: vendors, error: vErr } = await supabase
      .from("vendors")
      .select("id, slug, business_name")
      .in("id", vendorIds);
    if (vErr) throw new Error(vErr.message);
    vendorsById = new Map((vendors ?? []).map(v => [v.id, v]));
  }

  return (
    <main className="container py-4" style={{ maxWidth: 960 }}>
      <h1 className="mb-1">RFQ {rfq.id.slice(0, 8)}…</h1>
      {accepted && <div className="badge text-bg-success mb-3">Accepted</div>}
      {!isOwner && <div className="alert alert-info">View only — you’re not the owner of this RFQ.</div>}

      <div className="card mb-4">
        <div className="card-body">
          <div className="text-secondary small mb-2">
            {rfq.city || "-"}, {rfq.state || "-"}, {rfq.country || "-"} ·{" "}
            {rfq.event_date ? new Date(rfq.event_date).toLocaleDateString() : "Date TBD"} ·{" "}
            {rfq.guest_count ? `${rfq.guest_count} guests` : "Guest count TBD"}
            {(rfq.budget_min || rfq.budget_max) && ` · Budget: ${rfq.budget_min ?? "?"}–${rfq.budget_max ?? "?"}`}
          </div>
          {rfq.notes && <div>{rfq.notes}</div>}
        </div>
      </div>

      <h5 className="mb-3">
        Quotes ({quotes?.length ?? 0})
        {accepted && <span className="badge text-bg-success ms-2">Winner selected</span>}
      </h5>

      {!quotes?.length ? (
        <div className="alert alert-secondary">No quotes yet. Vendors will appear here after they respond.</div>
      ) : (
        <div className="vstack gap-3">
          {quotes.map((q) => {
            const v = vendorsById.get(q.vendor_id);
            const isWinner = rfq.accepted_quote_id === q.id;
            return (
              <div key={q.id} className={`border rounded p-3 ${isWinner ? "bg-success-subtle border-success" : "bg-body-secondary"}`}>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="fw-semibold">
                    {v ? (
                      <a href={`/vendors/${v.slug}`} className="text-decoration-none">{v.business_name}</a>
                    ) : (
                      <span>Vendor</span>
                    )}
                    {isWinner && <span className="badge text-bg-success ms-2">Winner</span>}
                  </div>
                  <div className="fs-5">
                    {typeof q.amount_cents === "number" ? `$${(q.amount_cents / 100).toLocaleString()}` : "—"}
                  </div>
                </div>
                <div className="small text-secondary mb-2">{new Date(q.created_at).toLocaleString()}</div>
                {q.message && <div>{q.message}</div>}
                {isOwner && !accepted && (
                  <div className="mt-2">
                    <AcceptButton rfq_id={rfq.id} quote_id={q.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

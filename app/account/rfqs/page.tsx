import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function RfqsListPage() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="container py-4" style={{ maxWidth: 960 }}>
        <h1 className="mb-3">My RFQs</h1>
        <div className="alert alert-warning">Please log in to view your RFQs.</div>
        <a className="btn btn-primary" href={`/login?next=${encodeURIComponent("/account/rfqs")}`}>
          Log in
        </a>
      </main>
    );
  }

  const { data: rfqs, error } = await supabase
    .from("rfqs")
    .select("id, created_at, city, state, country, event_date, accepted_quote_id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load RFQs", error);
    return (
      <main className="container py-4" style={{ maxWidth: 960 }}>
        <h1 className="mb-3">My RFQs</h1>
        <div className="alert alert-danger">We couldn’t load your RFQs right now. Please try again later.</div>
      </main>
    );
  }

  return (
    <main className="container py-4" style={{ maxWidth: 960 }}>
      <h1 className="mb-3">My RFQs</h1>
      {!rfqs?.length ? (
        <div className="alert alert-secondary">You haven’t created any RFQs yet.</div>
      ) : (
        <div className="list-group">
          {rfqs.map((r) => (
            <Link key={r.id} href={`/account/rfqs/${r.id}`} className="list-group-item list-group-item-action">
              <div className="d-flex w-100 justify-content-between">
                <h6 className="mb-1">RFQ {r.id.slice(0, 8)}…</h6>
                {r.accepted_quote_id && <span className="badge text-bg-success">Accepted</span>}
              </div>
              <small className="text-secondary">
                {(r.city || "-")}, {(r.state || "-")}, {(r.country || "-")} ·{" "}
                {r.event_date ? new Date(r.event_date).toLocaleDateString() : "Date TBD"}
              </small>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingOwnerColumnError, type OwnerColumn } from "@/lib/supabase/ownerColumns";

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

  const supabaseAdmin = createSupabaseAdminClient();

  const selectFields = "id, created_at, city, state, country, event_date, accepted_quote_id";
  const selectQuery = (client: SupabaseClient, column: OwnerColumn) =>
    client
      .from("rfqs")
      .select(selectFields)
      .eq(column, user.id)
      .order("created_at", { ascending: false });

  let ownerColumn: OwnerColumn = "owner_id";
  let { data: rfqs, error } = await selectQuery(supabase, ownerColumn);

  if (isMissingOwnerColumnError(error, ownerColumn)) {
    ownerColumn = "owner_uuid";
    const retry = await selectQuery(supabase, ownerColumn);
    rfqs = retry.data;
    error = retry.error;
  }

  if (error && supabaseAdmin && /infinite recursion detected in policy/i.test(error.message)) {
    const retry = await selectQuery(supabaseAdmin, ownerColumn);
    rfqs = retry.data;
    error = retry.error;
  }

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

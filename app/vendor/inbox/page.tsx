// app/vendor/inbox/page.tsx
import { getSupabaseServer } from "@/lib/supabase/server";
import QuoteForm from "./QuoteForm";

type InviteRow = {
  rfq_id: string;
  vendor_id: string;
  status: string;
  expires_at: string | null;
  created_at: string;
  contact_revealed: boolean | null; // ← NEW
  reveal_email: boolean | null;      // ← NEW
  reveal_phone: boolean | null;      // ← NEW
};

type RfqRow = {
  id: string;
  event_date: string | null;
  guest_count: number | null;
  budget_min: number | null;
  budget_max: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  language: string | null;
  theme: string | null;
  notes: string | null;
  created_at: string;
  contact_email: string | null;      // ← NEW
  contact_phone: string | null;      // ← NEW
};

export default async function VendorInboxPage() {
  const supabase = await getSupabaseServer();

  // who am I?
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return (
      <main className="container py-4" style={{ maxWidth: 960 }}>
        <div className="alert alert-warning">Please log in to view your vendor inbox.</div>
        <a className="btn btn-primary" href={`/login?next=${encodeURIComponent("/vendor/inbox")}`}>
          Log in
        </a>
      </main>
    );
  }

  // vendor owned by this user
  const { data: vendor, error: vErr } = await supabase
    .from("vendors")
    .select("id, business_name")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (vErr) throw new Error(vErr.message);

  if (!vendor) {
    return (
      <main className="container py-4" style={{ maxWidth: 960 }}>
        <h1 className="mb-3">Vendor inbox</h1>
        <div className="alert alert-info">
          You don’t have a vendor profile yet. Create it in{" "}
          <a href="/vendor/profile">Vendor Profile</a>.
        </div>
      </main>
    );
  }

  // invites for this vendor (include reveal flags)
  const { data: invites, error: invErr } = await supabase
    .from("rfq_invites")
    .select(
      "rfq_id, vendor_id, status, expires_at, created_at, contact_revealed, reveal_email, reveal_phone"
    )
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (invErr) throw new Error(invErr.message);

  const rfqIds = Array.from(new Set((invites ?? []).map((i) => i.rfq_id)));
  let rfqsById = new Map<string, RfqRow>();

  if (rfqIds.length) {
    const { data: rfqs, error: rErr } = await supabase
      .from("rfqs")
      .select(
        `
        id, event_date, guest_count, budget_min, budget_max,
        city, state, country, language, theme, notes, created_at,
        contact_email, contact_phone
        `
      )
      .in("id", rfqIds);

    if (rErr) throw new Error(rErr.message);
    rfqsById = new Map((rfqs ?? []).map((r) => [r.id, r]));
  }

  return (
    <main className="container py-4" style={{ maxWidth: 960 }}>
      <h1 className="mb-1">Vendor inbox</h1>
      <div className="text-secondary mb-4">{vendor.business_name}</div>

      {!invites?.length ? (
        <div className="alert alert-info">
          No invites yet. You’ll see RFQs here when customers invite you.
        </div>
      ) : (
        <div className="vstack gap-3">
          {invites.map((inv) => {
            const rfq = rfqsById.get(inv.rfq_id);
            return (
              <div className="card" key={`${inv.rfq_id}-${inv.created_at}`}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="badge text-bg-secondary mb-2">
                        {inv.status?.toUpperCase() || "PENDING"}
                      </div>
                      <h5 className="card-title mb-1">RFQ {inv.rfq_id.slice(0, 8)}…</h5>
                      <div className="text-secondary small mb-3">
                        {rfq?.city || "-"}, {rfq?.state || "-"}, {rfq?.country || "-"} ·{" "}
                        {rfq?.event_date ? new Date(rfq.event_date).toLocaleDateString() : "Date TBD"} ·{" "}
                        {rfq?.guest_count ? `${rfq.guest_count} guests` : "Guest count TBD"}
                        {rfq?.budget_min || rfq?.budget_max
                          ? ` · Budget: ${rfq?.budget_min ?? "?"}–${rfq?.budget_max ?? "?"}`
                          : ""}
                      </div>
                      {rfq?.notes && <p className="mb-0">{rfq.notes}</p>}
                    </div>
                    <div className="text-end small">
                      <div>Invited: {new Date(inv.created_at).toLocaleString()}</div>
                      {inv.expires_at && <div>Expires: {new Date(inv.expires_at).toLocaleString()}</div>}
                    </div>
                  </div>

                  {/* Contact reveal block */}
                  <div className="mt-3">
                    {inv.contact_revealed ? (
                      <div className="p-2 rounded border bg-success-subtle">
                        <span className="badge text-bg-success me-2">Contact revealed</span>
                        <div className="small">
                          {inv.reveal_email && rfq?.contact_email && (
                            <a href={`mailto:${rfq.contact_email}`}>{rfq.contact_email}</a>
                          )}
                          {inv.reveal_phone && rfq?.contact_phone && (
                            <span className={inv.reveal_email && rfq?.contact_email ? "ms-2" : ""}>
                              · {rfq.contact_phone}
                            </span>
                          )}
                          {!inv.reveal_email && !inv.reveal_phone && (
                            <span className="text-secondary">No contact fields were shared.</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="small text-secondary">
                        <span className="badge text-bg-secondary me-2">Contact hidden</span>
                        Appears automatically if your quote is accepted.
                      </div>
                    )}
                  </div>

                  <hr />

                  {/* Quote form (server also blocks after acceptance; UI left open for edits until then) */}
                  <QuoteForm rfq_id={inv.rfq_id} vendor_id={inv.vendor_id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

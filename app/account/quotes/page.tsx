import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function AccountQuotesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="container py-4" style={{ maxWidth: 960 }}>
        <h1 className="mb-3">Quotes received</h1>
        <div className="alert alert-warning">Please log in to view your quotes.</div>
        <Link className="btn btn-primary" href={`/login?next=${encodeURIComponent("/account/quotes")}`}>
          Log in
        </Link>
      </main>
    );
  }

  const supabaseAdmin = createSupabaseAdminClient();

  type RfqRow = {
    id: string;
    city: string | null;
    state: string | null;
    country: string | null;
    event_date: string | null;
    accepted_quote_id: string | null;
    created_at: string;
  };

  let { data: rfqs, error: rfqsErr } = await supabase
    .from("rfqs")
    .select("id, city, state, country, event_date, accepted_quote_id, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (rfqsErr && supabaseAdmin && /infinite recursion detected in policy/i.test(rfqsErr.message)) {
    const retry = await supabaseAdmin
      .from("rfqs")
      .select("id, city, state, country, event_date, accepted_quote_id, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    rfqs = retry.data;
    rfqsErr = retry.error;
  }

  if (rfqsErr) {
    throw new Error(rfqsErr.message);
  }

  const rfqRows = (rfqs ?? []) as RfqRow[];
  const rfqIds = rfqRows.map((r) => r.id);

  type QuoteRow = {
    id: string;
    rfq_id: string;
    vendor_id: string;
    amount_cents: number | null;
    currency: string | null;
    message: string | null;
    created_at: string;
  };

  let quotes: QuoteRow[] | null = null;
  let quotesErr: Error | null = null;

  if (rfqIds.length) {
    const result = await supabase
      .from("quotes")
      .select("id, rfq_id, vendor_id, amount_cents, currency, message, created_at")
      .in("rfq_id", rfqIds)
      .order("created_at", { ascending: false });

    quotes = result.data as QuoteRow[] | null;
    quotesErr = result.error as Error | null;

    if (quotesErr && supabaseAdmin && /infinite recursion detected in policy/i.test(quotesErr.message)) {
      const retry = await supabaseAdmin
        .from("quotes")
        .select("id, rfq_id, vendor_id, amount_cents, currency, message, created_at")
        .in("rfq_id", rfqIds)
        .order("created_at", { ascending: false });
      quotes = retry.data as QuoteRow[] | null;
      quotesErr = retry.error as Error | null;
    }

    if (quotesErr) {
      throw new Error(quotesErr.message);
    }
  }

  const vendorIds = Array.from(new Set((quotes ?? []).map((q) => q.vendor_id)));

  type VendorRow = { id: string; slug: string | null; business_name: string };
  let vendorsById = new Map<string, VendorRow>();

  if (vendorIds.length) {
    const { data: vendors, error: vendorsErr } = await supabase
      .from("vendors")
      .select("id, slug, business_name")
      .in("id", vendorIds);

    if (vendorsErr) {
      throw new Error(vendorsErr.message);
    }

    vendorsById = new Map((vendors ?? []).map((v) => [v.id, v]));
  }

  const rfqsById = new Map(rfqRows.map((r) => [r.id, r]));

  const items = (quotes ?? []).map((quote) => ({
    quote,
    rfq: rfqsById.get(quote.rfq_id) ?? null,
    vendor: vendorsById.get(quote.vendor_id) ?? null,
  }));

  return (
    <main className="container py-4" style={{ maxWidth: 960 }}>
      <h1 className="mb-3">Quotes received</h1>
      {!items.length ? (
        <div className="alert alert-secondary">You haven’t received any quotes yet.</div>
      ) : (
        <div className="vstack gap-3">
          {items.map(({ quote, rfq, vendor }) => {
            const accepted = rfq?.accepted_quote_id === quote.id;
            const statusLabel = accepted ? "Accepted" : "Pending";
            const eventDate = rfq?.event_date ? new Date(rfq.event_date).toLocaleDateString() : "Date TBD";
            return (
              <div
                key={quote.id}
                className={`card ${accepted ? "border-success" : ""}`}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-semibold">
                        {vendor ? (
                          vendor.slug ? (
                            <Link href={`/vendors/${vendor.slug}`} className="text-decoration-none">
                              {vendor.business_name}
                            </Link>
                          ) : (
                            vendor.business_name
                          )
                        ) : (
                          "Vendor"
                        )}
                      </div>
                      <div className="small text-secondary">
                        Received {new Date(quote.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className={`badge ${accepted ? "text-bg-success" : "text-bg-secondary"} mb-2`}>
                        {statusLabel}
                      </div>
                      <div className="fs-5">
                        {typeof quote.amount_cents === "number"
                          ? `$${(quote.amount_cents / 100).toLocaleString()}`
                          : quote.currency ?? "—"}
                      </div>
                    </div>
                  </div>
                  <div className="small text-secondary mt-3">
                    RFQ {quote.rfq_id.slice(0, 8)}… · {rfq?.city || "-"}, {rfq?.state || "-"}, {rfq?.country || "-"} · {eventDate}
                  </div>
                  {quote.message && <p className="mt-3 mb-0">{quote.message}</p>}
                  <div className="mt-3 d-flex justify-content-between align-items-center">
                    <Link className="btn btn-outline-primary btn-sm" href={`/account/rfqs/${quote.rfq_id}`}>
                      View RFQ details
                    </Link>
                    {accepted && <span className="text-success fw-semibold">Quote accepted</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

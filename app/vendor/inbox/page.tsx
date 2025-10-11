import { redirect } from 'next/navigation';
import { getRoles } from '@/lib/auth/roles';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import QuoteForm from './QuoteForm';

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
  contact_email: string | null;
  contact_phone: string | null;
  accepted_quote_id: string | null;
};

type QuoteRow = {
  id: string;
  rfq_id: string;
  vendor_id: string;
  amount_cents: number | null;
  currency: string | null;
  message: string | null;
  created_at: string;
};

export default async function VendorInboxPage() {
  const { user, isVendor } = await getRoles();
  if (!user || !isVendor) redirect('/signup/vendor');

  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();

  const { data: vendor, error: vErr } = await supabase
    .from('vendors')
    .select('id, business_name')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (vErr) throw new Error(vErr.message);

  if (!vendor) {
    return (
      <main className="container py-4" style={{ maxWidth: 960 }}>
        <h1 className="mb-3">Vendor inbox</h1>
        <div className="alert alert-info">
          You don’t have a vendor profile yet. Create it in{' '}
          <a href="/vendor/profile">Vendor Profile</a>.
        </div>
      </main>
    );
  }

  type InviteRow = {
    rfq_id: string;
    vendor_id: string;
    status: string | null;
    expires_at: string | null;
    created_at: string;
    contact_revealed?: boolean | null;
    reveal_email?: boolean | null;
    reveal_phone?: boolean | null;
  };

  let invites: InviteRow[] | null = null;
  let invErr: unknown = null;

  const invitesResult = await supabase
    .from('rfq_invites')
    .select(
      'rfq_id, vendor_id, status, expires_at, created_at, contact_revealed, reveal_email, reveal_phone'
    )
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })
    .limit(100);

  invErr = invitesResult.error;
  invites = invitesResult.data as InviteRow[] | null;

  if (invErr && invErr instanceof Error && /contact_revealed/.test(invErr.message)) {
    const fallback = await supabase
      .from('rfq_invites')
      .select('rfq_id, vendor_id, status, expires_at, created_at')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (fallback.error) throw new Error(fallback.error.message);

    invites = (fallback.data as InviteRow[] | null)?.map((inv) => {
      const accepted = inv.status?.toLowerCase() === 'accepted';
      return {
        ...inv,
        contact_revealed: accepted,
        reveal_email: accepted,
        reveal_phone: accepted,
      } satisfies InviteRow;
    }) ?? null;
    invErr = null;
  }

  if (invErr instanceof Error) throw new Error(invErr.message);

  let {
    data: quotes,
    error: quotesErr,
  } = await supabase
    .from('quotes')
    .select('id, rfq_id, vendor_id, amount_cents, currency, message, created_at')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (quotesErr && supabaseAdmin && /infinite recursion detected in policy/i.test(quotesErr.message)) {
    const retry = await supabaseAdmin
      .from('quotes')
      .select('id, rfq_id, vendor_id, amount_cents, currency, message, created_at')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })
      .limit(200);
    quotes = retry.data;
    quotesErr = retry.error;
  }

  if (quotesErr) throw new Error(quotesErr.message);

  const quotesByRfq = new Map<string, QuoteRow[]>();
  for (const quote of (quotes ?? []) as QuoteRow[]) {
    if (!quotesByRfq.has(quote.rfq_id)) {
      quotesByRfq.set(quote.rfq_id, []);
    }
    quotesByRfq.get(quote.rfq_id)?.push(quote);
  }

  const rfqIds = Array.from(
    new Set([
      ...(invites ?? []).map((i) => i.rfq_id),
      ...(quotes ?? []).map((q) => q.rfq_id),
    ])
  );
  let rfqsById = new Map<string, RfqRow>();

  if (rfqIds.length) {
    let { data: rfqs, error: rErr } = await supabase
      .from('rfqs')
      .select(
        `
        id, event_date, guest_count, budget_min, budget_max,
        city, state, country, language, theme, notes, created_at,
        contact_email, contact_phone, accepted_quote_id
        `
      )
      .in('id', rfqIds);

    if (rErr && supabaseAdmin && /infinite recursion detected in policy/i.test(rErr.message)) {
      const retry = await supabaseAdmin
        .from('rfqs')
        .select(
          `
          id, event_date, guest_count, budget_min, budget_max,
          city, state, country, language, theme, notes, created_at,
          contact_email, contact_phone, accepted_quote_id
          `
        )
        .in('id', rfqIds);
      rfqs = retry.data;
      rErr = retry.error;
    }

    if (rErr) throw new Error(rErr.message);
    rfqsById = new Map((rfqs ?? []).map((r) => [r.id, r]));
  }

  const items = rfqIds
    .map((rfqId) => {
      const invite = (invites ?? []).find((i) => i.rfq_id === rfqId) ?? null;
      const quotesForRfq = quotesByRfq.get(rfqId) ?? [];
      const latestQuote = quotesForRfq[0] ?? null;
      const latestDate = Math.max(
        invite ? new Date(invite.created_at).getTime() : 0,
        latestQuote ? new Date(latestQuote.created_at).getTime() : 0
      );

      return {
        rfqId,
        invite,
        quotes: quotesForRfq,
        latestQuote,
        latestDate,
      };
    })
    .sort((a, b) => b.latestDate - a.latestDate);

  return (
    <main className="container py-4" style={{ maxWidth: 960 }}>
      <h1 className="mb-1">Vendor inbox</h1>
      <div className="text-secondary mb-4">{vendor.business_name}</div>

      {!items.length ? (
        <div className="alert alert-info">
          No invites yet. You’ll see RFQs here when customers invite you.
        </div>
      ) : (
        <div className="vstack gap-3">
          {items.map(({ rfqId, invite, quotes: quotesForRfq, latestQuote }) => {
            const rfq = rfqsById.get(rfqId);
            const hasAcceptedQuote = Boolean(
              rfq?.accepted_quote_id &&
                quotesForRfq.some((q) => q.id === rfq.accepted_quote_id)
            );
            const statusLabel = hasAcceptedQuote
              ? 'ACCEPTED'
              : invite?.status
                ? invite.status.toUpperCase()
                : quotesForRfq.length
                  ? 'RESPONDED'
                  : 'PENDING';
            const inviteRevealed =
              invite?.contact_revealed ??
              (invite?.status?.toLowerCase() === 'accepted' ? true : undefined);
            const contactRevealed = Boolean(inviteRevealed) || hasAcceptedQuote;
            const revealEmail = invite?.reveal_email ?? contactRevealed;
            const revealPhone = invite?.reveal_phone ?? contactRevealed;
            return (
              <div className="card" key={`${rfqId}-${invite?.created_at ?? latestQuote?.created_at ?? 'none'}`}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="badge text-bg-secondary mb-2">
                        {statusLabel}
                      </div>
                      <h5 className="card-title mb-1">RFQ {rfqId.slice(0, 8)}…</h5>
                      <div className="text-secondary small mb-3">
                        {rfq?.city || '-'}, {rfq?.state || '-'}, {rfq?.country || '-'} ·{' '}
                        {rfq?.event_date ? new Date(rfq.event_date).toLocaleDateString() : 'Date TBD'} ·{' '}
                        {rfq?.guest_count ? `${rfq.guest_count} guests` : 'Guest count TBD'}
                        {rfq?.budget_min || rfq?.budget_max
                          ? ` · Budget: ${rfq?.budget_min ?? '?'}–${rfq?.budget_max ?? '?'}`
                          : ''}
                      </div>
                      {rfq?.notes && <p className="mb-0">{rfq.notes}</p>}
                    </div>
                    <div className="text-end small">
                      {invite?.created_at && (
                        <div>Invited: {new Date(invite.created_at).toLocaleString()}</div>
                      )}
                      {invite?.expires_at && (
                        <div>Expires: {new Date(invite.expires_at).toLocaleString()}</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    {contactRevealed ? (
                      <div className="p-2 rounded border bg-success-subtle">
                        <span className="badge text-bg-success me-2">Contact revealed</span>
                        <div className="small">
                          {revealEmail && rfq?.contact_email && (
                            <a href={`mailto:${rfq.contact_email}`}>{rfq.contact_email}</a>
                          )}
                          {revealPhone && rfq?.contact_phone && (
                            <span className={revealEmail && rfq?.contact_email ? 'ms-2' : ''}>
                              · {rfq.contact_phone}
                            </span>
                          )}
                          {!revealEmail && !revealPhone && (
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

                  {latestQuote && (
                    <div className="mt-3 p-3 border rounded bg-body-tertiary">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="fw-semibold">Quote sent</div>
                        <div>
                          {typeof latestQuote.amount_cents === 'number'
                            ? `$${(latestQuote.amount_cents / 100).toLocaleString()}`
                            : latestQuote.currency ?? '—'}
                        </div>
                      </div>
                      <div className="small text-secondary">
                        {new Date(latestQuote.created_at).toLocaleString()}
                      </div>
                      {latestQuote.message && <div className="mt-2">{latestQuote.message}</div>}
                    </div>
                  )}

                  <hr />

                  <QuoteForm rfq_id={rfqId} vendor_id={vendor.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

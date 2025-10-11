import { redirect } from 'next/navigation';
import { getRoles } from '@/lib/auth/roles';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { dictionaries, isSupportedLanguage, type SupportedLanguage } from '@/lib/i18n';

type QuoteRow = {
  id: string;
  rfq_id: string;
  vendor_id: string;
  amount_cents: number | null;
  currency: string | null;
  message: string | null;
  created_at: string;
};

type RfqRow = {
  id: string;
  event_date: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  accepted_quote_id: string | null;
  contact_email: string | null;
  contact_phone: string | null;
};

type InviteRow = {
  rfq_id: string;
  status: string | null;
  contact_revealed?: boolean | null;
  reveal_email?: boolean | null;
  reveal_phone?: boolean | null;
};

export default async function VendorQuotesPage() {
  const { user, isVendor } = await getRoles();
  if (!user || !isVendor) redirect('/signup/vendor');

  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();

  const [{ data: vendor, error: vErr }, { data: profile }] = await Promise.all([
    supabase.from('vendors').select('id, business_name').eq('owner_id', user.id).maybeSingle(),
    supabase.from('profiles').select('language').eq('id', user.id).maybeSingle(),
  ]);

  if (vErr) throw new Error(vErr.message);

  const profileLanguage = profile?.language;
  const language: SupportedLanguage = isSupportedLanguage(profileLanguage) ? profileLanguage : 'en';
  const dictionary = dictionaries[language];
  const locale = language === 'es' ? 'es-ES' : 'en-US';

  if (!vendor) {
    return (
      <main className="container py-4" style={{ maxWidth: 960 }}>
        <h1 className="mb-3">{dictionary.vendorQuotes.title}</h1>
        <div className="alert alert-info">
          {dictionary.vendorRfqs.noProfile.message}{' '}
          <a href="/vendor/profile">{dictionary.vendorRfqs.noProfile.linkLabel}</a>.
        </div>
      </main>
    );
  }

  let { data: quotes, error: quotesErr } = await supabase
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
    quotes = retry.data as QuoteRow[] | null;
    quotesErr = retry.error;
  }

  if (quotesErr) throw new Error(quotesErr.message);

  const quoteRows = (quotes ?? []) as QuoteRow[];

  if (!quoteRows.length) {
    return (
      <main className="container py-4" style={{ maxWidth: 960 }}>
        <h1 className="mb-3">{dictionary.vendorQuotes.title}</h1>
        <div className="alert alert-secondary">{dictionary.vendorQuotes.empty}</div>
      </main>
    );
  }

  const rfqIds = Array.from(new Set(quoteRows.map((q) => q.rfq_id)));

  let { data: rfqs, error: rfqsErr } = await supabase
    .from('rfqs')
    .select('id, event_date, city, state, country, accepted_quote_id, contact_email, contact_phone')
    .in('id', rfqIds);

  if (rfqsErr && supabaseAdmin && /infinite recursion detected in policy/i.test(rfqsErr.message)) {
    const retry = await supabaseAdmin
      .from('rfqs')
      .select('id, event_date, city, state, country, accepted_quote_id, contact_email, contact_phone')
      .in('id', rfqIds);
    rfqs = retry.data as RfqRow[] | null;
    rfqsErr = retry.error;
  }

  if (rfqsErr) throw new Error(rfqsErr.message);

  const rfqsById = new Map((rfqs ?? []).map((rfq) => [rfq.id, rfq] as const));

  let invitesByRfq = new Map<string, InviteRow>();

  if (rfqIds.length) {
    const invitesResult = await supabase
      .from('rfq_invites')
      .select('rfq_id, status, contact_revealed, reveal_email, reveal_phone')
      .eq('vendor_id', vendor.id)
      .in('rfq_id', rfqIds);

    let invites = invitesResult.data as InviteRow[] | null;
    let invitesErr: unknown = invitesResult.error;

    if (invitesErr instanceof Error && /contact_revealed/.test(invitesErr.message)) {
      const fallback = await supabase
        .from('rfq_invites')
        .select('rfq_id, status')
        .eq('vendor_id', vendor.id)
        .in('rfq_id', rfqIds);

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
      invitesErr = null;
    }

    if (invitesErr instanceof Error) throw new Error(invitesErr.message);

    invitesByRfq = new Map((invites ?? []).map((inv) => [inv.rfq_id, inv]));
  }

  return (
    <main className="container py-4" style={{ maxWidth: 960 }}>
      <h1 className="mb-1">{dictionary.vendorQuotes.title}</h1>
      <div className="text-secondary mb-4">{vendor.business_name}</div>

      <div className="vstack gap-3">
        {quoteRows.map((quote) => {
          const rfq = rfqsById.get(quote.rfq_id) ?? null;
          const invite = invitesByRfq.get(quote.rfq_id) ?? null;
          const accepted = rfq?.accepted_quote_id === quote.id;
          const rawStatus = invite?.status?.toLowerCase() ?? null;
          const statusLabel = (() => {
            if (accepted) return dictionary.vendorRfqs.status.accepted;
            if (!rawStatus) return dictionary.vendorQuotes.status.sent;
            switch (rawStatus) {
              case 'accepted':
                return dictionary.vendorRfqs.status.accepted;
              case 'responded':
                return dictionary.vendorRfqs.status.responded;
              case 'pending':
                return dictionary.vendorRfqs.status.pending;
              case 'declined':
                return dictionary.vendorRfqs.status.declined;
              case 'expired':
                return dictionary.vendorRfqs.status.expired;
              default:
                return rawStatus.toUpperCase();
            }
          })();
          const inviteRevealed = invite?.contact_revealed ?? (invite?.status?.toLowerCase() === 'accepted' ? true : undefined);
          const contactRevealed = Boolean(inviteRevealed) || accepted;
          const revealEmail = invite?.reveal_email ?? contactRevealed;
          const revealPhone = invite?.reveal_phone ?? contactRevealed;

          return (
            <div
              key={quote.id}
              className={`card ${accepted ? 'border-success bg-success-subtle' : ''}`}
            >
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="badge text-bg-secondary mb-2">{statusLabel}</div>
                    <h5 className="card-title mb-1">
                      {dictionary.vendorRfqs.rfqLabel} {quote.rfq_id.slice(0, 8)}…
                    </h5>
                    <div className="text-secondary small mb-2">
                      {rfq?.city || '-'}, {rfq?.state || '-'}, {rfq?.country || '-'} ·{' '}
                      {rfq?.event_date
                        ? new Date(rfq.event_date).toLocaleDateString(locale)
                        : dictionary.vendorRfqs.eventDateTbd}
                    </div>
                    <div className="small text-secondary">
                      {dictionary.vendorQuotes.sentLabel}{' '}
                      {new Date(quote.created_at).toLocaleString(locale)}
                    </div>
                  </div>
                  <div className="text-end fs-5">
                    {typeof quote.amount_cents === 'number'
                      ? `$${(quote.amount_cents / 100).toLocaleString(locale)}`
                      : quote.currency ?? '—'}
                  </div>
                </div>

                {quote.message && <div className="mt-3">{quote.message}</div>}

                {contactRevealed ? (
                  <div className="mt-3 p-2 rounded border bg-success-subtle">
                    <span className="badge text-bg-success me-2">{dictionary.vendorRfqs.contact.revealed}</span>
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
                        <span className="text-secondary">{dictionary.vendorRfqs.contact.noneShared}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 small text-secondary">
                    <span className="badge text-bg-secondary me-2">{dictionary.vendorRfqs.contact.hidden}</span>
                    {dictionary.vendorQuotes.contact.hiddenNote}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

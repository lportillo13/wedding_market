import { redirect } from 'next/navigation';
import { getRoles } from '@/lib/auth/roles';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import VendorRfqsView from './VendorRfqsView';
import type { InviteRow, QuoteRow, RfqRow, VendorRfqsItem } from './types';

export default async function VendorRfqsPage() {
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
        <VendorRfqsView hasVendorProfile={false} items={[]} />
      </main>
    );
  }

  const invitesResult = await supabase
    .from('rfq_invites')
    .select(
      'rfq_id, vendor_id, status, expires_at, created_at, contact_revealed, reveal_email, reveal_phone'
    )
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })
    .limit(100);

  let invites = invitesResult.data as InviteRow[] | null;
  let invErr: unknown = invitesResult.error;

  if (invErr instanceof Error && /contact_revealed/.test(invErr.message)) {
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

  const rfqIds = Array.from(new Set((invites ?? []).map((i) => i.rfq_id)));

  const quotesByRfq = new Map<string, QuoteRow[]>();

  if (rfqIds.length) {
    let { data: quotes, error: quotesErr } = await supabase
      .from('quotes')
      .select('id, rfq_id, vendor_id, amount_cents, currency, message, created_at')
      .eq('vendor_id', vendor.id)
      .in('rfq_id', rfqIds)
      .order('created_at', { ascending: false });

    if (quotesErr && supabaseAdmin && /infinite recursion detected in policy/i.test(quotesErr.message)) {
      const retry = await supabaseAdmin
        .from('quotes')
        .select('id, rfq_id, vendor_id, amount_cents, currency, message, created_at')
        .eq('vendor_id', vendor.id)
        .in('rfq_id', rfqIds)
        .order('created_at', { ascending: false });
      quotes = retry.data;
      quotesErr = retry.error;
    }

    if (quotesErr) throw new Error(quotesErr.message);

    for (const quote of (quotes ?? []) as QuoteRow[]) {
      if (!quotesByRfq.has(quote.rfq_id)) {
        quotesByRfq.set(quote.rfq_id, []);
      }
      quotesByRfq.get(quote.rfq_id)?.push(quote);
    }
  }

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

  const items: VendorRfqsItem[] = (invites ?? []).map((invite) => {
    const quotesForRfq = quotesByRfq.get(invite.rfq_id) ?? [];
    const latestQuote = quotesForRfq[0] ?? null;
    return {
      invite,
      rfq: rfqsById.get(invite.rfq_id) ?? null,
      latestQuote,
      quotesForRfq,
    };
  });

  return (
    <main className="container py-4" style={{ maxWidth: 960 }}>
      <VendorRfqsView
        hasVendorProfile
        items={items}
        vendorId={vendor.id}
        vendorName={vendor.business_name ?? undefined}
      />
    </main>
  );
}

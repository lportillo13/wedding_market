import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMissingOwnerColumnError, type OwnerColumn } from "@/lib/supabase/ownerColumns";

export type QuoteMessageRow = {
  id: string;
  quote_id: string;
  sender_id: string;
  sender_role: "client" | "vendor";
  body: string;
  created_at: string;
};

function shouldUseAdminFallback(message: string | undefined) {
  return /policy|permission|row-level security|infinite recursion detected/i.test(message ?? "");
}

function isMissingQuoteMessagesTableError(message: string | undefined) {
  return /quote_messages/i.test(message ?? "") && /does not exist|could not find/i.test(message ?? "");
}

type ClientReplyPermission = {
  allowed: boolean;
  message?: string;
};

async function verifyQuoteThreadOpen(
  supabase: SupabaseClient,
  supabaseAdmin: SupabaseClient | null,
  rfqId: string,
  vendorId: string,
): Promise<ClientReplyPermission> {
  const selectInvite = (client: SupabaseClient) =>
    client
      .from("rfq_invites")
      .select("status, expires_at")
      .eq("rfq_id", rfqId)
      .eq("vendor_id", vendorId)
      .maybeSingle<{ status: string | null; expires_at: string | null }>();

  let { data: invite, error } = await selectInvite(supabase);
  if (error && supabaseAdmin && shouldUseAdminFallback(error.message)) {
    const retry = await selectInvite(supabaseAdmin);
    invite = retry.data;
    error = retry.error;
  }

  if (error) return { allowed: false, message: error.message };
  if (!invite) return { allowed: false, message: "Quote request not found." };

  const status = invite.status?.trim().toLowerCase();
  if (status === "declined" || status === "expired") {
    return { allowed: false, message: "This quote conversation is closed." };
  }

  const selectRfq = (client: SupabaseClient) =>
    client
      .from("rfqs")
      .select("accepted_quote_id")
      .eq("id", rfqId)
      .maybeSingle<{ accepted_quote_id: string | null }>();

  let { data: rfq, error: rfqError } = await selectRfq(supabase);
  if ((rfqError || !rfq) && supabaseAdmin) {
    const retry = await selectRfq(supabaseAdmin);
    rfq = retry.data;
    rfqError = retry.error;
  }
  if (rfqError) return { allowed: false, message: rfqError.message };
  if (!rfq) return { allowed: false, message: "Quote request not found." };

  if (rfq.accepted_quote_id) {
    const { data: acceptedQuote, error: acceptedQuoteError } = await (supabaseAdmin ?? supabase)
      .from("quotes")
      .select("vendor_id")
      .eq("id", rfq.accepted_quote_id)
      .maybeSingle<{ vendor_id: string }>();

    if (acceptedQuoteError) return { allowed: false, message: acceptedQuoteError.message };
    if (!acceptedQuote || acceptedQuote.vendor_id !== vendorId) {
      return { allowed: false, message: "This quote conversation is closed." };
    }
    return { allowed: true };
  }

  const expiresAt = invite.expires_at ? Date.parse(invite.expires_at) : Number.NaN;
  if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
    return { allowed: false, message: "This quote conversation is closed." };
  }

  return { allowed: true };
}

export async function fetchQuoteMessagesByQuoteIds(
  quoteIds: string[]
): Promise<Map<string, QuoteMessageRow[]>> {
  const byQuoteId = new Map<string, QuoteMessageRow[]>();
  if (!quoteIds.length) {
    return byQuoteId;
  }

  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();

  const selectMessages = async (client: SupabaseClient) =>
    client
      .from("quote_messages")
      .select("id, quote_id, sender_id, sender_role, body, created_at")
      .in("quote_id", quoteIds)
      .order("created_at", { ascending: true });

  let { data, error } = await selectMessages(supabase);

  if (error && isMissingQuoteMessagesTableError(error.message)) {
    return byQuoteId;
  }

  if (error && supabaseAdmin && shouldUseAdminFallback(error.message)) {
    const retry = await selectMessages(supabaseAdmin);
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  for (const message of (data ?? []) as QuoteMessageRow[]) {
    if (!byQuoteId.has(message.quote_id)) {
      byQuoteId.set(message.quote_id, []);
    }
    byQuoteId.get(message.quote_id)?.push(message);
  }

  return byQuoteId;
}

export async function verifyClientQuoteReplyAccess(
  quoteId: string,
  rfqId: string,
  vendorId: string,
  userId: string,
  authenticatedClient?: SupabaseClient,
): Promise<ClientReplyPermission> {
  const supabase = authenticatedClient ?? await createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();

  const selectQuote = (client: SupabaseClient) =>
    client
      .from("quotes")
      .select("id, rfq_id, vendor_id")
      .eq("id", quoteId)
      .maybeSingle<{ id: string; rfq_id: string; vendor_id: string }>();

  let { data: quote, error: quoteErr } = await selectQuote(supabase);
  if (quoteErr && supabaseAdmin && shouldUseAdminFallback(quoteErr.message)) {
    const retry = await selectQuote(supabaseAdmin);
    quote = retry.data;
    quoteErr = retry.error;
  }
  if (quoteErr) {
    return { allowed: false, message: quoteErr.message };
  }
  if (!quote || quote.rfq_id !== rfqId || quote.vendor_id !== vendorId) {
    return { allowed: false, message: "Quote not found." };
  }

  const selectRfq = (client: SupabaseClient, column: OwnerColumn) =>
    client.from("rfqs").select(column === "owner_id" ? "id, owner_id" : "id, owner_id:owner_uuid").eq("id", rfqId).maybeSingle<{ id: string; owner_id: string }>();

  let ownerColumn: OwnerColumn = "owner_id";
  let { data: rfq, error: rfqErr } = await selectRfq(supabase, ownerColumn);

  if (isMissingOwnerColumnError(rfqErr, ownerColumn)) {
    ownerColumn = "owner_uuid";
    const retry = await selectRfq(supabase, ownerColumn);
    rfq = retry.data;
    rfqErr = retry.error;
  }

  if (rfqErr && supabaseAdmin && shouldUseAdminFallback(rfqErr.message)) {
    const retry = await selectRfq(supabaseAdmin, ownerColumn);
    rfq = retry.data;
    rfqErr = retry.error;
  }

  if (rfqErr) {
    return { allowed: false, message: rfqErr.message };
  }
  if (!rfq || rfq.owner_id !== userId) {
    return { allowed: false, message: "You do not have access to this quote." };
  }

  return verifyQuoteThreadOpen(supabase, supabaseAdmin, rfqId, vendorId);
}

export async function verifyVendorQuoteReplyAccess(
  quoteId: string,
  rfqId: string,
  vendorId: string,
  userId: string,
  authenticatedClient?: SupabaseClient,
): Promise<ClientReplyPermission> {
  const supabase = authenticatedClient ?? await createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();

  const { data: vendor, error: vendorErr } = await supabase
    .from("vendors")
    .select("id")
    .eq("id", vendorId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (vendorErr) {
    return { allowed: false, message: vendorErr.message };
  }
  if (!vendor) {
    return { allowed: false, message: "Vendor access required." };
  }

  const selectQuote = (client: SupabaseClient) =>
    client
      .from("quotes")
      .select("id, rfq_id, vendor_id")
      .eq("id", quoteId)
      .maybeSingle<{ id: string; rfq_id: string; vendor_id: string }>();

  let { data: quote, error: quoteErr } = await selectQuote(supabase);
  if (quoteErr && supabaseAdmin && shouldUseAdminFallback(quoteErr.message)) {
    const retry = await selectQuote(supabaseAdmin);
    quote = retry.data;
    quoteErr = retry.error;
  }
  if (quoteErr) {
    return { allowed: false, message: quoteErr.message };
  }
  if (!quote || quote.rfq_id !== rfqId || quote.vendor_id !== vendorId) {
    return { allowed: false, message: "Quote not found." };
  }

  return verifyQuoteThreadOpen(supabase, supabaseAdmin, rfqId, vendorId);
}

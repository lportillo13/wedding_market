import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMissingOwnerColumnError, type OwnerColumn } from "@/lib/supabase/ownerColumns";

export type QuoteMessageRow = {
  id: string;
  quote_id: string | null;
  sender_id: string;
  sender_role: "client" | "vendor";
  body: string;
  created_at: string;
};

function isMissingQuoteMessagesTableError(message: string | undefined) {
  return /quote_messages/i.test(message ?? "") && /does not exist|could not find/i.test(message ?? "");
}

type ClientReplyPermission = {
  allowed: boolean;
  message?: string;
};

async function verifyQuoteThreadOpen(supabase: SupabaseClient,quoteId: string): Promise<ClientReplyPermission> {
  const {data,error}=await supabase.rpc("wm_thread_is_open",{p_quote:quoteId});
  return error || !data ? {allowed:false,message:"This quote conversation is closed."} : {allowed:true};
}

export async function fetchQuoteMessagesByQuoteIds(
  quoteIds: string[]
): Promise<Map<string, QuoteMessageRow[]>> {
  const byQuoteId = new Map<string, QuoteMessageRow[]>();
  if (!quoteIds.length) {
    return byQuoteId;
  }

  const supabase = await createSupabaseServerClient();

  const selectMessages = async (client: SupabaseClient) =>
    client
      .from("quote_messages")
      .select("id, quote_id, sender_id, sender_role, body, created_at")
      .in("quote_id", quoteIds)
      .order("created_at", { ascending: true });

  const { data, error } = await selectMessages(supabase);

  if (error && isMissingQuoteMessagesTableError(error.message)) {
    return byQuoteId;
  }

  if (error) {
    throw new Error(error.message);
  }

  for (const message of (data ?? []) as QuoteMessageRow[]) {
    if (!message.quote_id) continue;
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

  const selectQuote = (client: SupabaseClient) =>
    client
      .from("quotes")
      .select("id, rfq_id, vendor_id")
      .eq("id", quoteId)
      .maybeSingle<{ id: string; rfq_id: string; vendor_id: string }>();

  const { data: quote, error: quoteErr } = await selectQuote(supabase);

  if (quoteErr) {
    return { allowed: false, message: quoteErr.message };
  }
  if (!quote || quote.rfq_id !== rfqId || quote.vendor_id !== vendorId) {
    return { allowed: false, message: "Quote not found." };
  }

  const selectRfq = (client: SupabaseClient, column: OwnerColumn) =>
    client.from("rfqs_visible").select(column === "owner_id" ? "id, owner_id" : "id, owner_id:owner_uuid").eq("id", rfqId).maybeSingle<{ id: string; owner_id: string }>();

  let ownerColumn: OwnerColumn = "owner_id";
  let { data: rfq, error: rfqErr } = await selectRfq(supabase, ownerColumn);

  if (isMissingOwnerColumnError(rfqErr, ownerColumn)) {
    ownerColumn = "owner_uuid";
    const retry = await selectRfq(supabase, ownerColumn);
    rfq = retry.data;
    rfqErr = retry.error;
  }

  if (rfqErr) {
    return { allowed: false, message: rfqErr.message };
  }
  if (!rfq || rfq.owner_id !== userId) {
    return { allowed: false, message: "You do not have access to this quote." };
  }

  return verifyQuoteThreadOpen(supabase, quoteId);
}

export async function verifyVendorQuoteReplyAccess(
  quoteId: string,
  rfqId: string,
  vendorId: string,
  userId: string,
  authenticatedClient?: SupabaseClient,
): Promise<ClientReplyPermission> {
  const supabase = authenticatedClient ?? await createSupabaseServerClient();

  const selectVendor = (client: SupabaseClient) => client
    .from("vendors")
    .select("id")
    .eq("id", vendorId)
    .eq("owner_id", userId)
    .maybeSingle();

  const { data: vendor, error: vendorErr } = await selectVendor(supabase);

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

  const { data: quote, error: quoteErr } = await selectQuote(supabase);

  if (quoteErr) {
    return { allowed: false, message: quoteErr.message };
  }
  if (!quote || quote.rfq_id !== rfqId || quote.vendor_id !== vendorId) {
    return { allowed: false, message: "Quote not found." };
  }

  return verifyQuoteThreadOpen(supabase, quoteId);
}

/** Read complete, ordered history in bounded pages, scoped to one RLS thread. */
export async function fetchThreadMessages(client: SupabaseClient, rfqId: string, vendorId: string): Promise<QuoteMessageRow[]> {
  const messages: QuoteMessageRow[] = [];
  for (let offset = 0; ; offset += 200) {
    const {data, error} = await client.from("quote_messages")
      .select("id,quote_id,sender_id,sender_role,body,created_at")
      .eq("rfq_id",rfqId).eq("vendor_id",vendorId)
      .order("created_at",{ascending:true}).order("id",{ascending:true}).range(offset,offset+199);
    if (error) throw new Error("Unable to load conversation history.");
    messages.push(...(data ?? []) as QuoteMessageRow[]);
    if (!data || data.length < 200) return messages;
  }
}

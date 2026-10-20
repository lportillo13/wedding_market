import type { SupabaseClient } from "@supabase/supabase-js";
import { createQuoteAnsweredNotification } from "@/lib/notifications";
import { quoteInputSchema } from "@/lib/quotes/input";

type Quote = {
  id: string;
  version: number;
  amountCents: number;
  currency: "USD";
  message: string | null;
  createdAt: string;
};

type Result =
  | { ok: true; quote: Quote }
  | { ok: false; status: 400 | 403 | 404 | 409 | 503; message: string };

/** Web actions and native API routes use the same workflow and caller's RLS session. */
export async function submitVendorQuote(
  client: SupabaseClient,
  userId: string,
  payload: unknown,
  notify = createQuoteAnsweredNotification,
): Promise<Result> {
  const parsed = quoteInputSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, status: 400, message: "Enter a valid quote amount and message." };
  const input = parsed.data;

  try {
    const { data: vendor, error: vendorError } = await client.from("vendors")
      .select("id, business_name").eq("id", input.vendorId).eq("owner_id", userId)
      .maybeSingle<{ id: string; business_name: string | null }>();
    if (vendorError) return { ok: false, status: 503, message: "Unable to check vendor access. Please try again." };
    if (!vendor) return { ok: false, status: 403, message: "Vendor access required." };

    const [{ data: invite, error: inviteError }, { data: rfq, error: rfqError }] = await Promise.all([
      client.from("rfq_invites").select("status, accepted_quote_id, expires_at, closed_at")
        .eq("rfq_id", input.rfqId).eq("vendor_id", input.vendorId)
        .maybeSingle<{ status: string | null; accepted_quote_id: string | null; expires_at: string | null; closed_at: string | null }>(),
      client.from("rfqs_visible").select("owner_id").eq("id", input.rfqId)
        .maybeSingle<{ owner_id: string | null }>(),
    ]);
    if (inviteError || rfqError) return { ok: false, status: 503, message: "Unable to load this request. Please try again." };
    if (!invite || !rfq) return { ok: false, status: 404, message: "Request not found." };
    const status = invite.status?.trim().toLowerCase() ?? "";
    const expired = Boolean(invite.expires_at && Date.parse(invite.expires_at) <= Date.now());
    if (invite.accepted_quote_id || invite.closed_at || ["declined", "expired", "accepted"].includes(status) || expired) {
      return { ok: false, status: 409, message: "This quote request is closed or expired." };
    }

    // PostgreSQL rechecks invitation state and allocates the version atomically.
    const { data: saved, error: saveError } = await client.from("quotes")
      .insert({
        rfq_id: input.rfqId,
        vendor_id: input.vendorId,
        amount_cents: input.amountCents,
        currency: "USD",
        message: input.message || null,
      })
      .select("id, version, created_at").single<{ id: string; version: number; created_at: string }>();
    if (saveError || !saved) {
      return saveError?.code === "42501"
        ? { ok: false, status: 409, message: "This request is no longer available for a quote. Refresh the conversation." }
        : { ok: false, status: 503, message: "Unable to send quote. Please try again." };
    }

    // From here the quote is committed. Optional effects must never report it as failed.
    try {
      const now = new Date().toISOString();
      const { error } = await client.from("rfq_invites")
        .update({ status: "responded", last_activity_at: now, vendor_last_read_at: now })
        .eq("rfq_id", input.rfqId).eq("vendor_id", input.vendorId);
      if (error) console.warn("Quote saved; inbox activity update failed.");
    } catch {
      console.warn("Quote saved; inbox activity update failed.");
    }
    if (rfq.owner_id) {
      try {
        const { error } = await notify(client, {
          recipientId: rfq.owner_id,
          actorId: userId,
          rfqId: input.rfqId,
          quoteId: saved.id,
          vendorId: input.vendorId,
          vendorName: vendor.business_name,
          amountCents: input.amountCents,
          isUpdate: saved.version > 1,
        });
        if (error) console.warn("Quote saved; notification creation failed.");
      } catch {
        console.warn("Quote saved; notification creation failed.");
      }
    }
    return {
      ok: true,
      quote: {
        id: saved.id,
        version: saved.version,
        amountCents: input.amountCents,
        currency: "USD",
        message: input.message || null,
        createdAt: saved.created_at,
      },
    };
  } catch {
    return { ok: false, status: 503, message: "The quote service is temporarily unavailable. Please try again." };
  }
}

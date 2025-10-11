"use server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingOwnerColumnError, type OwnerColumn } from "@/lib/supabase/ownerColumns";
import { redirect } from "next/navigation";

export async function acceptQuote(
  _prevState: unknown,
  form: FormData
): Promise<{ ok: boolean; message?: string }> {
  const rfq_id = form.get("rfq_id")?.toString();
  const quote_id = form.get("quote_id")?.toString();
  const reveal_email = form.get("reveal_email") === "on";
  const reveal_phone = form.get("reveal_phone") === "on";

  if (!rfq_id || !quote_id) return { ok: false, message: "Missing RFQ or quote." };

  const supabase = await getSupabaseServer();
  const supabaseAdmin = createSupabaseAdminClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return { ok: false, message: "Please log in." };

  // Load RFQ (guard: only owner may accept; only once)
  const selectColumns = {
    owner_id: "id, owner_id, accepted_quote_id",
    owner_uuid: "id, owner_id:owner_uuid, accepted_quote_id",
  } as const satisfies Record<OwnerColumn, string>;

  const selectWithOwner = (client: SupabaseClient, column: OwnerColumn) =>
    client
      .from("rfqs")
      .select(selectColumns[column])
      .eq("id", rfq_id)
      .maybeSingle();

  let ownerColumn: OwnerColumn = "owner_id";
  let { data: rfq, error: rfqErr } = await selectWithOwner(supabase, ownerColumn);

  if (isMissingOwnerColumnError(rfqErr, ownerColumn)) {
    ownerColumn = "owner_uuid";
    const retry = await selectWithOwner(supabase, ownerColumn);
    rfq = retry.data;
    rfqErr = retry.error;
  }

  if (rfqErr && supabaseAdmin && /infinite recursion detected in policy/i.test(rfqErr.message)) {
    const retry = await selectWithOwner(supabaseAdmin, ownerColumn);
    rfq = retry.data;
    rfqErr = retry.error;
  }

  if (rfqErr) return { ok: false, message: rfqErr.message };
  if (!rfq || rfq.owner_id !== user.id) return { ok: false, message: "Not allowed." };
  if (rfq.accepted_quote_id) return { ok: false, message: "A quote is already accepted." };

  // Load quote (must belong to this RFQ)
  const { data: quote, error: qErr } = await supabase
    .from("quotes")
    .select("id, rfq_id, vendor_id")
    .eq("id", quote_id)
    .maybeSingle();
  if (qErr) return { ok: false, message: qErr.message };
  if (!quote || quote.rfq_id !== rfq_id) return { ok: false, message: "Invalid quote." };

  // Accept
  let { error: updErr } = await supabase
    .from("rfqs")
    .update({ accepted_quote_id: quote_id, accepted_at: new Date().toISOString() })
    .eq("id", rfq_id);

  if (updErr && supabaseAdmin && /infinite recursion detected in policy/i.test(updErr.message)) {
    const retry = await supabaseAdmin
      .from("rfqs")
      .update({ accepted_quote_id: quote_id, accepted_at: new Date().toISOString() })
      .eq("id", rfq_id);
    updErr = retry.error;
  }
  if (updErr) return { ok: false, message: updErr.message };

  // Reveal chosen contact fields for the winning vendor
  let { error: revealErr } = await supabase
    .from("rfq_invites")
    .update({
      contact_revealed: true,
      reveal_email,
      reveal_phone,
      status: "accepted",
    })
    .eq("rfq_id", rfq_id)
    .eq("vendor_id", quote.vendor_id);

  if (revealErr && supabaseAdmin && /infinite recursion detected in policy/i.test(revealErr.message)) {
    const retry = await supabaseAdmin
      .from("rfq_invites")
      .update({
        contact_revealed: true,
        reveal_email,
        reveal_phone,
        status: "accepted",
      })
      .eq("rfq_id", rfq_id)
      .eq("vendor_id", quote.vendor_id);
    revealErr = retry.error;
  }

  if (revealErr && /contact_revealed/.test(revealErr.message)) {
    const fallback = await supabase
      .from("rfq_invites")
      .update({ status: "accepted" })
      .eq("rfq_id", rfq_id)
      .eq("vendor_id", quote.vendor_id);
    revealErr = fallback.error;

    if (revealErr && supabaseAdmin && /infinite recursion detected in policy/i.test(revealErr.message)) {
      const retry = await supabaseAdmin
        .from("rfq_invites")
        .update({ status: "accepted" })
        .eq("rfq_id", rfq_id)
        .eq("vendor_id", quote.vendor_id);
      revealErr = retry.error;
    }
  }

  if (revealErr) return { ok: false, message: revealErr.message };

  // Force page re-render so button disappears
  redirect(`/account/rfqs/${rfq_id}?accepted=1`);
}

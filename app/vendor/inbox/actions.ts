// app/vendor/inbox/actions.ts
"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

export type SendQuoteState = { ok: boolean; message?: string };

export async function sendQuote(_: SendQuoteState, form: FormData): Promise<SendQuoteState> {
  const supabase = await getSupabaseServer();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return { ok: false, message: "Not authenticated." };

  const rfq_id = form.get("rfq_id")?.toString();
  const vendor_id = form.get("vendor_id")?.toString();
  const amount_usd = form.get("amount_usd")?.toString();
  const message = form.get("message")?.toString() ?? null;

  if (!rfq_id || !vendor_id) return { ok: false, message: "Missing RFQ or vendor." };

  // vendor ownership check
  const { data: vendor, error: vErr } = await supabase
    .from("vendors")
    .select("id")
    .eq("id", vendor_id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (vErr) return { ok: false, message: vErr.message };
  if (!vendor) return { ok: false, message: "You don’t own this vendor." };

  // 🚧 NEW: refuse if RFQ already accepted
  const { data: rfq, error: rErr } = await supabase
    .from("rfqs")
    .select("accepted_quote_id")
    .eq("id", rfq_id)
    .maybeSingle();
  if (rErr) return { ok: false, message: rErr.message };
  if (!rfq) return { ok: false, message: "RFQ not found." };
  if (rfq.accepted_quote_id) return { ok: false, message: "This request is already accepted." };

  // parse amount → cents
  const dollars = Number((amount_usd ?? "").replace(/[^0-9.]/g, ""));
  if (!isFinite(dollars) || dollars <= 0) return { ok: false, message: "Invalid amount." };
  const amount_cents = Math.round(dollars * 100);

  const { error: qErr } = await supabase
    .from("quotes")
    .insert([{ rfq_id, vendor_id, amount_cents, currency: "USD", message }]);
  if (qErr) return { ok: false, message: qErr.message };

  await supabase
    .from("rfq_invites")
    .update({ status: "responded" })
    .eq("rfq_id", rfq_id)
    .eq("vendor_id", vendor_id);

  return { ok: true };
}

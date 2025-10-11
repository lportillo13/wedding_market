"use server";
import { getSupabaseServer } from "@/lib/supabase/server";
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
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return { ok: false, message: "Please log in." };

  // Load RFQ (guard: only owner may accept; only once)
  const { data: rfq } = await supabase
    .from("rfqs")
    .select("id, owner_id, accepted_quote_id")
    .eq("id", rfq_id)
    .maybeSingle();
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
  const { error: updErr } = await supabase
    .from("rfqs")
    .update({ accepted_quote_id: quote_id, accepted_at: new Date().toISOString() })
    .eq("id", rfq_id);
  if (updErr) return { ok: false, message: updErr.message };

  // Reveal chosen contact fields for the winning vendor
  await supabase
    .from("rfq_invites")
    .update({ contact_revealed: true, reveal_email, reveal_phone })
    .eq("rfq_id", rfq_id)
    .eq("vendor_id", quote.vendor_id);

  // Force page re-render so button disappears
  redirect(`/account/rfqs/${rfq_id}?accepted=1`);
}

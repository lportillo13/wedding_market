// app/shortlist/actions.ts
"use server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export type CreateRfqState = { ok: boolean; message?: string; rfq_id?: string };

const MAX_INVITES = 10;
const QUOTE_EXPIRES_DAYS = 14;

async function handleCreateRfqAndInvites(formData: FormData): Promise<CreateRfqState> {
  const supabase = await getSupabaseServer();
  const supabaseAdmin = createSupabaseAdminClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return { ok: false, message: "Not authenticated." };

  // vendor ids from hidden JSON
  let vendorIds: string[] = [];
  try {
    const json = formData.get("vendor_ids_json")?.toString() ?? "[]";
    vendorIds = JSON.parse(json);
  } catch {
    return { ok: false, message: "Invalid vendor list." };
  }
  vendorIds = Array.from(new Set(vendorIds)).slice(0, MAX_INVITES);
  if (vendorIds.length === 0) return { ok: false, message: "Select at least one vendor." };

  const event_date = formData.get("event_date")?.toString() || null;
  const guest_count = Number(formData.get("guest_count") || 0) || null;
  const budget_min = Number(formData.get("budget_min") || 0) || null;
  const budget_max = Number(formData.get("budget_max") || 0) || null;
  const city = formData.get("city")?.toString() || null;
  const state = formData.get("state")?.toString() || null;
  const country = formData.get("country")?.toString() || null;
  const language = formData.get("language")?.toString() || "en";
  const theme = formData.get("theme")?.toString() || null;
  const notes = formData.get("notes")?.toString() || null;

  // 👇 NEW: store contact info (fallback email to user.email)
  const contact_email = formData.get("contact_email")?.toString().trim() || user.email || null;
  const contact_phone = formData.get("contact_phone")?.toString().trim() || null;

  // 1) Create RFQ
  let {
    data: rfq,
    error: rfqErr,
  } = await supabase
    .from("rfqs")
    .insert([{
      owner_id: user.id,
      event_date, guest_count, budget_min, budget_max,
      city, state, country, language, theme, notes,
      contact_email, contact_phone,
    }])
    .select("id")
    .single();

  if (rfqErr && supabaseAdmin && /infinite recursion detected in policy/i.test(rfqErr.message)) {
    const retry = await supabaseAdmin
      .from("rfqs")
      .insert([{
        owner_id: user.id,
        event_date, guest_count, budget_min, budget_max,
        city, state, country, language, theme, notes,
        contact_email, contact_phone,
      }])
      .select("id")
      .single();
    rfq = retry.data;
    rfqErr = retry.error;
  }

  if (rfqErr || !rfq) return { ok: false, message: rfqErr?.message || "Failed to create RFQ." };

  // 2) Create invites
  const expires_at = new Date(Date.now() + QUOTE_EXPIRES_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const inviteRows = vendorIds.map((vendor_id) => ({ rfq_id: rfq.id, vendor_id, expires_at }));
  let { error: invErr } = await supabase.from("rfq_invites").insert(inviteRows);

  if (invErr && supabaseAdmin && /infinite recursion detected in policy/i.test(invErr.message)) {
    const retry = await supabaseAdmin.from("rfq_invites").insert(inviteRows);
    invErr = retry.error;
  }

  if (invErr) return { ok: false, message: invErr.message };

  redirect(`/rfq/sent?rfq=${rfq.id}&count=${vendorIds.length}`);
}

export async function createRfqAndInvites(_: CreateRfqState, formData: FormData): Promise<CreateRfqState> {
  return handleCreateRfqAndInvites(formData);
}

export async function submitShortlistRfq(formData: FormData): Promise<void> {
  await handleCreateRfqAndInvites(formData);
}

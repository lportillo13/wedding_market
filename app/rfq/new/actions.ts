"use server";

import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";

export type CreateRfqState = { ok: boolean; message?: string };

const MAX_INVITES = 10;
const QUOTE_EXPIRES_DAYS = 14;

export async function createRfqAndInvites(_: CreateRfqState, formData: FormData): Promise<CreateRfqState> {
  const supabase = await getSupabaseServer();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return { ok: false, message: "Please log in first." };

  let vendorIds: string[] = [];
  try {
    vendorIds = JSON.parse((formData.get("vendor_ids_json") as string) || "[]");
  } catch {
    return { ok: false, message: "Invalid vendor list." };
  }
  vendorIds = Array.from(new Set(vendorIds)).slice(0, MAX_INVITES);
  if (!vendorIds.length) return { ok: false, message: "Your shortlist is empty." };

  const payload = {
    owner_id: user.id,
    event_date: formData.get("event_date") || null,
    guest_count: Number(formData.get("guest_count") || 0) || null,
    budget_min: Number(formData.get("budget_min") || 0) || null,
    budget_max: Number(formData.get("budget_max") || 0) || null,
    city: formData.get("city") || null,
    state: formData.get("state") || null,
    country: formData.get("country") || null,
    language: formData.get("language") || "en",
    theme: formData.get("theme") || null,
    notes: formData.get("notes") || null,
  };

  const { data: rfq, error: rfqErr } = await supabase.from("rfqs").insert([payload]).select("id").single();
  if (rfqErr || !rfq) return { ok: false, message: rfqErr?.message || "Failed to create RFQ." };

  const expires_at = new Date(Date.now() + QUOTE_EXPIRES_DAYS * 86400_000).toISOString();
  const invites = vendorIds.map((vendor_id) => ({ rfq_id: rfq.id, vendor_id, expires_at }));
  const { error: invErr } = await supabase.from("rfq_invites").insert(invites);
  if (invErr) return { ok: false, message: invErr.message };

  redirect(`/rfq/sent?rfq=${rfq.id}&count=${vendorIds.length}`);
}

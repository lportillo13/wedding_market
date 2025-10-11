"use server";
import { getSupabaseServer } from "@/lib/supabase/server";

export type ReviewState = { ok: boolean; message?: string };

export async function createReview(formData: FormData): Promise<ReviewState> {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please log in." };

  const rfq_id = formData.get("rfq_id")?.toString();
  const vendor_id = formData.get("vendor_id")?.toString();
  const stars = Number(formData.get("stars"));
  const title = formData.get("title")?.toString() || null;
  const body = formData.get("body")?.toString() || null;

  if (!rfq_id || !vendor_id) return { ok: false, message: "Missing RFQ or vendor." };
  if (!(stars >= 1 && stars <= 5)) return { ok: false, message: "Stars must be 1–5." };

  const { error } = await supabase.from("reviews").insert([{
    rfq_id, vendor_id, author_id: user.id, stars, title, body
  }]);
  if (error) return { ok: false, message: error.message };

  return { ok: true };
}

export async function updateReview(formData: FormData): Promise<ReviewState> {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Please log in." };

  const id = formData.get("id")?.toString();
  const stars = Number(formData.get("stars"));
  const title = formData.get("title")?.toString() || null;
  const body = formData.get("body")?.toString() || null;

  if (!id) return { ok: false, message: "Missing review id." };
  if (!(stars >= 1 && stars <= 5)) return { ok: false, message: "Stars must be 1–5." };

  const { error } = await supabase
    .from("reviews")
    .update({ stars, title, body })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  return { ok: true };
}

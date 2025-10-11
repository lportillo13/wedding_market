"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";

export type PubState = { ok: boolean; message: string; published?: boolean };

export async function setPublishStatus(
  _prev: PubState,
  formData: FormData
): Promise<PubState> {
  const publish = formData.get("publish") === "on";

  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: uerr } = await supabase.auth.getUser();
    if (uerr || !user) return { ok: false, message: "Not authenticated." };

    // Make sure the vendor exists
    const { data: vendor, error: verr } = await supabase
      .from("vendors")
      .select("id, business_name, slug, is_published")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (verr) return { ok: false, message: verr.message };
    if (!vendor) return { ok: false, message: "Create your profile first." };

    if (!vendor.business_name || !vendor.slug) {
      return { ok: false, message: "Business name and slug are required before publishing." };
    }

    // Update publish flag
    const { error: uperr } = await supabase
      .from("vendors")
      .update({ is_published: publish })
      .eq("id", vendor.id);

    if (uperr) return { ok: false, message: uperr.message };

    revalidatePath("/vendor/publish");
    revalidatePath(`/vendors/${vendor.slug}`); // public page
    return { ok: true, message: publish ? "Published!" : "Unpublished.", published: publish };
  } catch (e: any) {
    return { ok: false, message: String(e?.message || e) };
  }
}

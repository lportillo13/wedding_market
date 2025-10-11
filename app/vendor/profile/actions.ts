"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";

// tiny helper to keep slugs URL-safe
function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export type SaveState = {
  ok: boolean;
  message: string;
  slug?: string;
  fieldErrors?: Record<string, string>;
};

export async function saveProfile(
  _prevState: SaveState,
  formData: FormData
): Promise<SaveState> {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return { ok: false, message: "Not authenticated." };
    }

    const business_name = String(formData.get("business_name") || "").trim();
    const slugRaw = String(formData.get("slug") || "").trim();
    const bio_en = String(formData.get("bio_en") || "");
    const bio_es = String(formData.get("bio_es") || "");

    const fieldErrors: Record<string, string> = {};
    if (!business_name) fieldErrors.business_name = "Required";
    let slug = slugRaw ? slugify(slugRaw) : slugify(business_name);
    if (!slug) fieldErrors.slug = "Slug cannot be empty";

    if (Object.keys(fieldErrors).length) {
      return { ok: false, message: "Please fix the errors.", fieldErrors };
    }

    // Do we already have a vendor for this user?
    const { data: existing, error: selErr } = await supabase
      .from("vendors")
      .select("id, slug")
      .eq("owner_id", user.id)
      .maybeSingle();

    // Ensure slug is unique (simple check)
    if (slug) {
      const { data: other } = await supabase
        .from("vendors")
        .select("id")
        .eq("slug", slug)
        .neq("owner_id", user.id)
        .maybeSingle();
      if (other) {
        slug = `${slug}-${user.id.slice(0, 6)}`;
      }
    }

    if (!existing) {
      // Insert
      const { error: insErr } = await supabase.from("vendors").insert({
        owner_id: user.id,
        business_name,
        slug,
        bio: { en: bio_en, es: bio_es },
        is_published: false,
      });
      if (insErr) {
        return { ok: false, message: `Save failed: ${insErr.message}` };
      }
    } else {
      // Update
      const { error: upErr } = await supabase
        .from("vendors")
        .update({
          business_name,
          slug,
          bio: { en: bio_en, es: bio_es },
        })
        .eq("owner_id", user.id);
      if (upErr) {
        return { ok: false, message: `Save failed: ${upErr.message}` };
      }
    }

    // Revalidate dashboard and the public vendor page (if you have one)
    revalidatePath("/vendor/profile");
    revalidatePath(`/vendors/${slug}`);

    return { ok: true, message: "Profile saved.", slug };
  } catch (e: any) {
    return { ok: false, message: String(e?.message || e) };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";

type SupabaseServerClient = Awaited<ReturnType<typeof getSupabaseServer>>;

async function getVendorContext() {
  const supabase: SupabaseServerClient = await getSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");

  const uidArg = { _uid: user.id } satisfies { _uid: string };
  const { data: isVendor, error: roleErr } = await supabase.rpc("is_vendor", uidArg);
  if (roleErr) throw new Error(roleErr.message);
  if (!isVendor) throw new Error("Vendor access required");

  return { supabase, user };
}

async function ensureVendorId() {
  const { supabase, user } = await getVendorContext();
  // find existing
  const { data: existing } = await supabase
    .from("vendors")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existing?.id) return existing.id;

  // create minimal vendor row
  const defaultSlug = `vendor-${user.id.slice(0, 8)}`;
  const { data, error } = await supabase
    .from("vendors")
    .insert({
      owner_id: user.id,
      slug: defaultSlug,
      business_name: "Untitled Vendor",
      bio: { en: "", es: "" },
      extra_info: { en: "", es: "" },
      is_published: false,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  return data.id as string;
}

export async function saveProfile(formData: FormData) {
  const id = await ensureVendorId();
  const name = (formData.get("business_name") as string)?.trim() || "Untitled Vendor";
  const slugInput = (formData.get("slug") as string)?.trim();
  const slug = slugify(slugInput || name);
  const bio_en = (formData.get("bio_en") as string) ?? "";
  const bio_es = (formData.get("bio_es") as string) ?? "";
  const extra_info_en = (formData.get("extra_info_en") as string) ?? "";
  const extra_info_es = (formData.get("extra_info_es") as string) ?? "";

  const { supabase } = await getVendorContext();

  // Enforce unique slug (simple check)
  const { data: other } = await supabase
    .from("vendors")
    .select("id")
    .eq("slug", slug)
    .neq("id", id)
    .maybeSingle();
  if (other) throw new Error("Slug already in use.");

  const { error } = await supabase
    .from("vendors")
    .update({
      business_name: name,
      slug,
      bio: { en: bio_en, es: bio_es },
      extra_info: { en: extra_info_en, es: extra_info_es },
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/vendor/profile");
  revalidatePath(`/vendors/${slug}`);
  revalidatePath("/vendors");
}

export async function saveLocation(formData: FormData) {
  const id = await ensureVendorId();
  const city = (formData.get("city") as string) || null;
  const region = (formData.get("region") as string) || null;
  const country = (formData.get("country") as string) || null;
  const lat = formData.get("lat") ? Number(formData.get("lat")) : null;
  const lng = formData.get("lng") ? Number(formData.get("lng")) : null;

  const { supabase } = await getVendorContext();

  const { error } = await supabase
    .from("vendor_locations")
    .upsert({ vendor_id: id, city, region, country, lat, lng });

  if (error) throw new Error(error.message);

  revalidatePath("/vendor/location");
  revalidatePath("/vendors");
}

export async function saveCategories(formData: FormData) {
  const id = await ensureVendorId();
  const keys = formData.getAll("categories") as string[];

  const { supabase } = await getVendorContext();

  // Look up category ids
  const { data: cats, error: catErr } = await supabase
    .from("categories")
    .select("id,key")
    .in("key", keys);

  if (catErr) throw new Error(catErr.message);

  // Clear existing
  const { error: delErr } = await supabase
    .from("vendor_categories")
    .delete()
    .eq("vendor_id", id);
  if (delErr) throw new Error(delErr.message);

  // Insert new
  if (cats && cats.length) {
    const rows = cats.map((c) => ({ vendor_id: id, category_id: c.id }));
    const { error: insErr } = await supabase.from("vendor_categories").insert(rows);
    if (insErr) throw new Error(insErr.message);
  }

  revalidatePath("/vendor/categories");
  revalidatePath("/vendors");
}

export async function setPublish(publish: boolean) {
  const id = await ensureVendorId();
  const { supabase } = await getVendorContext();

  const { error } = await supabase
    .from("vendors")
    .update({ is_published: publish })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/vendor/publish");
  revalidatePath("/vendors");
}

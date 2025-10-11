"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";

export type SaveLocState = { ok: boolean; message: string };

export async function saveLocation(
  _prev: SaveLocState,
  form: FormData
): Promise<SaveLocState> {
  const supabase = await getSupabaseServer();
  const { data: { user }, error: uerr } = await supabase.auth.getUser();
  if (uerr || !user) return { ok: false, message: "Not authenticated." };

  // ensure the user has a vendor
  const { data: vendor, error: verr } = await supabase
    .from("vendors")
    .select("id, slug")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (verr) return { ok: false, message: verr.message };
  if (!vendor) return { ok: false, message: "Create your vendor profile first." };

  const address = String(form.get("address") || "").trim();
  const city = String(form.get("city") || "").trim();
  const state = String(form.get("state") || "").trim();
  const country = String(form.get("country") || "").trim();
  const lat = form.get("lat") ? Number(form.get("lat")) : null;
  const lng = form.get("lng") ? Number(form.get("lng")) : null;
  const radius = Math.max(1, Math.min(500, Number(form.get("service_radius_km") || 50)));

  const { error: upErr } = await supabase
    .from("vendor_locations")
    .upsert(
      {
        vendor_id: vendor.id,
        address, city, state, country,
        lat, lng,
        service_radius_km: radius,
      },
      { onConflict: "vendor_id" }
    );

  if (upErr) return { ok: false, message: upErr.message };

  revalidatePath("/vendor/location");
  return { ok: true, message: "Location saved." };
}

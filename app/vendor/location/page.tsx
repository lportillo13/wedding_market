export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { getUserAndRole } from "@/lib/auth/guards";
import { getSupabaseServer } from "@/lib/supabase/server";
import LocationForm from "./locationForm";
import ClientOnly from "@/components/ClientOnly";

export default async function LocationPage() {
  const { user } = await getUserAndRole();
  if (!user) redirect(`/login?next=${encodeURIComponent("/vendor/location")}`);

  const supabase = await getSupabaseServer();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!vendor) redirect("/vendor/profile");

  const { data: loc } = await supabase
    .from("vendor_locations")
    .select("address, city, state, country, lat, lng, service_radius_km")
    .eq("vendor_id", vendor.id)
    .maybeSingle();

  const initial = {
    address: loc?.address ?? "",
    city: loc?.city ?? "",
    state: loc?.state ?? "",
    country: loc?.country ?? "",
    lat: loc?.lat ?? null,
    lng: loc?.lng ?? null,
    service_radius_km: loc?.service_radius_km ?? 50,
  };

  return (
    <div className="row">
      <div className="col-lg-6">
        <h2 className="mb-3">Location & Service Area</h2>
        <ClientOnly>
          <LocationForm initial={initial} />
        </ClientOnly>
      </div>
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin/requireAdmin";
import { getSupabaseForAdmin } from "@/lib/admin/supabase";
import { normalizeVendorAdsConfig } from "@/lib/content/vendorAds";

export async function PUT(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const config = normalizeVendorAdsConfig((body as { config?: unknown }).config);
  const supabase = await getSupabaseForAdmin();
  const { error } = await supabase.from("site_settings").upsert(
    {
      key: "vendors.ads.config",
      value: config,
    },
    { onConflict: "key" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/private-control-room-hub/vendor-ads");
  revalidatePath("/vendors");

  return NextResponse.json({ ok: true, config });
}

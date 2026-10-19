import { directoryInteger, searchVendorDirectory } from "@/lib/vendor-directory";
import { getRoles } from "@/lib/auth/roles";
import { VENDOR_ADS_PUBLICLY_VISIBLE } from "@/lib/content/vendorAds";
import { loadSponsoredVendorAds, loadVendorAdsConfig } from "@/lib/content/vendorAdsServer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import VendorsPageContent from "./VendorsPageContent";
import type { CategoryOption, VendorListItem, VendorsResponse } from "./types";

async function fetchVendors(params: Record<string,string>): Promise<VendorsResponse> {
  try { return await searchVendorDirectory(params); }
  catch { return {items:[],total:0,page:directoryInteger(params.page,1,1000),pageSize:12,error:true}; }
}

async function fetchVendorCategories(): Promise<CategoryOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("key, label")
    .order("key", { ascending: true });

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to load vendor categories; falling back to homepage categories.", error);
    }

    return [];
  }

  return (data ?? []) as CategoryOption[];
}

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const { user, isVendor } = await getRoles();
  const [{ items, total, error }, adsConfig, categories] = await Promise.all([
    fetchVendors(sp),
    loadVendorAdsConfig(),
    fetchVendorCategories(),
  ]);
  const sponsoredVendors = VENDOR_ADS_PUBLICLY_VISIBLE
    ? await loadSponsoredVendorAds(adsConfig, {
        userId: user?.id ?? null,
        searchQuery: sp.q ?? null,
        category: sp.category ?? null,
      })
    : [];

  const page = directoryInteger(sp.page,1,1000);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  return (
    <VendorsPageContent
      error={error}
      items={items as VendorListItem[]}
      isVendor={isVendor}
      page={page}
      totalPages={totalPages}
      searchParams={sp}
      adsConfig={adsConfig}
      sponsoredVendors={sponsoredVendors}
      categories={categories}
    />
  );
}

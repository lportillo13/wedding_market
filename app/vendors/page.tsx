import { headers } from "next/headers";
import { getRoles } from "@/lib/auth/roles";
import { VENDOR_ADS_PUBLICLY_VISIBLE } from "@/lib/content/vendorAds";
import { loadSponsoredVendorAds, loadVendorAdsConfig } from "@/lib/content/vendorAdsServer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import VendorsPageContent from "./VendorsPageContent";
import type { CategoryOption, VendorListItem, VendorsResponse } from "./types";

async function fetchVendors(sp: Record<string, string>): Promise<VendorsResponse> {
  const qs = new URLSearchParams();
  if (sp.q) qs.set("q", sp.q);
  if (sp.category) qs.set("category", sp.category);
  if (sp.page) qs.set("page", sp.page);
  const page = Number(sp.page || 1);
  const pageSize = 12;

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const requestBase = `${proto}://${host}`;
  const configuredBase = process.env.NEXT_PUBLIC_APP_URL;

  let base = requestBase;
  if (configuredBase) {
    try {
      const requestUrl = new URL(requestBase);
      const configuredUrl = new URL(configuredBase);
      const isLocalRequest = /^(localhost|127\.0\.0\.1)$/i.test(requestUrl.hostname);
      base = isLocalRequest ? requestBase : configuredUrl.origin;
    } catch {
      base = requestBase;
    }
  }

  const url = `${base}/api/vendors${qs.toString() ? `?${qs.toString()}` : ""}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`No se pudieron cargar los proveedores (${res.status})`);
    }

    return res.json();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to load vendors; rendering an empty directory state.", error);
    }

    return { items: [], total: 0, page, pageSize };
  }
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
  const [{ items, total }, adsConfig, categories] = await Promise.all([
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

  const page = Number(sp.page || 1);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  return (
    <VendorsPageContent
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

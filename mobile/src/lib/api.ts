import { mobileConfig } from "./config";
import { requestJson } from "./http";

export type VendorImage = {
  url?: string | null;
  public_id?: string | null;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  type?: string | null;
};

export type VendorListItem = {
  id: string;
  slug: string;
  business_name: string;
  bio_en: string;
  bio_es?: string | null;
  categories?: string[] | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
  rating_avg?: number | null;
  rating_count?: number | null;
  logo_url?: string | null;
  hero_image?: VendorImage | null;
  thumbnail_image?: VendorImage | null;
};

export type VendorDetail = VendorListItem & {
  extra_info_en?: string | null;
  extra_info_es?: string | null;
  logo_url?: string | null;
  gallery_images?: VendorImage[] | null;
  location?: {
    city?: string | null;
    region?: string | null;
    country?: string | null;
    address_label?: string | null;
    service_radius_km?: number | null;
  } | null;
  starting_price_cents?: number | null;
  starting_price_currency?: string | null;
  typical_spend_cents?: number | null;
  typical_spend_currency?: string | null;
  years_in_business?: number | null;
  languages?: string[] | null;
  team_size_range?: string | null;
  event_types?: string[] | null;
  phone?: string | null;
  website_url?: string | null;
  capacity_max?: number | null;
  review_ai_summary?: string | null;
  peak_seasons?: string[] | null;
  category_details?: {
    key: string | null;
    slug: string | null;
    label: string;
  }[] | null;
  media?: (VendorImage & { caption?: string | null; sort?: number | null })[] | null;
  spaces?: {
    id: string;
    name: string | null;
    description: string | null;
    capacity_min: number | null;
    capacity_max: number | null;
  }[] | null;
  pricing?: {
    item_key: string;
    price_cents: number | null;
    currency: string;
    contact_for_price: boolean;
    notes: string | null;
  }[] | null;
  amenities?: {
    amenities: { key: string; label: string }[];
    ceremony_types: { key: string; label: string }[];
    settings: { key: string; label: string }[];
    services: { key: string; label: string }[];
  } | null;
  team?: {
    id: string;
    name: string;
    title: string | null;
    bio: string | null;
    headshot_url: string | null;
    responds_within_hours: number | null;
  }[] | null;
  availability?: {
    id: string;
    date: string;
    status: "available" | "busy";
  }[] | null;
  reviews?: {
    id: string;
    rating: number | null;
    title: string | null;
    body: string | null;
    created_at: string;
  }[];
  review_distribution?: { rating: number; count: number }[] | null;
};

export type VendorsResponse = {
  items: VendorListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type VendorSearchParams = {
  q?: string;
  category?: string;
  page?: number;
  pageSize?: number;
};

export async function fetchVendors(params: VendorSearchParams = {}): Promise<VendorsResponse> {
  if (!mobileConfig.webApiUrl) {
    throw new Error("EXPO_PUBLIC_WEB_API_URL is not configured.");
  }

  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set("q", params.q);
  if (params.category) searchParams.set("category", params.category);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));

  const query = searchParams.toString();
  return requestJson<VendorsResponse>(`${mobileConfig.webApiUrl}/api/vendors${query ? `?${query}` : ""}`);
}

export async function fetchVendorDetail(slug: string): Promise<VendorDetail> {
  if (!mobileConfig.webApiUrl) {
    throw new Error("EXPO_PUBLIC_WEB_API_URL is not configured.");
  }

  const payload = await requestJson<{ vendor?: VendorDetail | null; error?: string }>(
    `${mobileConfig.webApiUrl}/api/vendors/${encodeURIComponent(slug)}`,
  );
  if (!payload.vendor) {
    throw new Error(payload.error ?? "Vendor not found.");
  }

  return payload.vendor;
}

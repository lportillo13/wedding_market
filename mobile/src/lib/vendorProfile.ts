import { mobileConfig } from "./config";
import { supabase } from "./supabase";

export type VendorEditorTab =
  | "details"
  | "contact"
  | "pricing"
  | "amenities"
  | "team"
  | "availability"
  | "reviews"
  | "images";

export type VendorEditorData = {
  vendor: Record<string, any>;
  pricing: Record<string, any>[];
  amenityOptions: Record<string, any>[];
  selectedAmenities: string[];
  team: Record<string, any>[];
  availability: Record<string, any>[];
};

function client() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Check mobile/.env.");
  }
  return supabase;
}

function csvToArray(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function moneyToCents(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed.replace(/[^0-9,.-]/g, "").replace(/,/g, "."));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

function localized(value: string) {
  const trimmed = value.trim();
  return trimmed ? { en: trimmed, es: trimmed } : null;
}

export function localizedText(value: unknown, locale: "en" | "es" = "en") {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record[locale] ?? record.en ?? record.es ?? "");
  }
  return "";
}

export async function loadVendorEditorData(): Promise<VendorEditorData | null> {
  const db = client();
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) {
    throw new Error("Sign in required.");
  }

  const { data: vendor, error } = await db
    .from("vendors")
    .select(
      "id, slug, business_name, is_published, bio, extra_info, logo_url, hero_image, thumbnail_image, gallery_images, phone, website_url, map_url, address_label, starting_price_cents, starting_price_currency, event_types, years_in_business, languages, team_size_range, pricing_typical_spend_cents, pricing_typical_spend_currency, pricing_peak_seasons, capacity_max, review_ai_summary"
    )
    .eq("owner_id", user.id)
    .maybeSingle<Record<string, any>>();

  if (error) throw new Error(error.message);
  if (!vendor) return null;

  const vendorId = String(vendor.id);
  const [pricing, amenities, selectedAmenities, team, availability] = await Promise.all([
    db.from("vendor_pricing").select("item_key, price_cents, currency, contact_for_price, notes").eq("vendor_id", vendorId),
    db.from("amenity_lookup").select("key, group_key, label").order("group_key").order("key"),
    db.from("vendor_amenities").select("amenity_key").eq("vendor_id", vendorId),
    db
      .from("vendor_team")
      .select("id, name, title, bio, headshot_url, responds_within_hours, sort_order")
      .eq("vendor_id", vendorId)
      .order("sort_order", { ascending: true }),
    db
      .from("vendor_availability")
      .select("id, available_on, availability_status")
      .eq("vendor_id", vendorId)
      .order("available_on", { ascending: true }),
  ]);

  const firstError = pricing.error ?? amenities.error ?? selectedAmenities.error ?? team.error ?? availability.error;
  if (firstError) throw new Error(firstError.message);

  return {
    vendor,
    pricing: pricing.data ?? [],
    amenityOptions: amenities.data ?? [],
    selectedAmenities: (selectedAmenities.data ?? []).map((row) => String(row.amenity_key)),
    team: team.data ?? [],
    availability: availability.data ?? [],
  };
}

export async function saveVendorDetails(vendorId: string, values: Record<string, string>) {
  const db = client();
  const extraInfo = { en: values.extra_info_en ?? "", es: values.extra_info_es ?? "" };
  const { error } = await db
    .from("vendors")
    .update({
      business_name: values.business_name.trim(),
      slug: values.slug.trim(),
      bio: { en: values.bio_en ?? "", es: values.bio_es ?? "" },
      extra_info: extraInfo,
    })
    .eq("id", vendorId);
  if (error) throw new Error(error.message);
}

export async function saveVendorContact(vendorId: string, values: Record<string, string>) {
  const db = client();
  const { error } = await db
    .from("vendors")
    .update({
      phone: values.phone.trim() || null,
      website_url: values.website_url.trim() || null,
      map_url: values.map_url.trim() || null,
      address_label: values.address_label.trim() || null,
      starting_price_cents: moneyToCents(values.starting_price),
      starting_price_currency: values.starting_price_currency.trim().toUpperCase() || "USD",
      event_types: csvToArray(values.event_types),
      years_in_business: toInteger(values.years_in_business),
      languages: csvToArray(values.languages),
      team_size_range: values.team_size_range.trim() || null,
    })
    .eq("id", vendorId);
  if (error) throw new Error(error.message);
}

export async function saveVendorPricing(vendorId: string, values: Record<string, string>, pricingRows: Record<string, string>[]) {
  const db = client();
  const currency = values.typical_currency.trim().toUpperCase() || "USD";
  const rows = pricingRows
    .map((row) => ({
      vendor_id: vendorId,
      item_key: row.item_key,
      price_cents: row.contact_for_price === "true" ? null : moneyToCents(row.price),
      currency,
      contact_for_price: row.contact_for_price === "true",
      notes: localized(row.notes),
    }))
    .filter((row) => row.contact_for_price || row.price_cents !== null || row.notes);

  await db.from("vendor_pricing").delete().eq("vendor_id", vendorId);
  if (rows.length) {
    const { error } = await db.from("vendor_pricing").insert(rows);
    if (error) throw new Error(error.message);
  }

  const { error } = await db
    .from("vendors")
    .update({
      pricing_typical_spend_cents: moneyToCents(values.typical_spend),
      pricing_typical_spend_currency: currency,
      pricing_peak_seasons: csvToArray(values.peak_seasons),
    })
    .eq("id", vendorId);
  if (error) throw new Error(error.message);
}

export async function saveVendorAmenities(vendorId: string, selectedKeys: string[], values: Record<string, string>) {
  const db = client();
  await db.from("vendor_amenities").delete().eq("vendor_id", vendorId);
  if (selectedKeys.length) {
    const { error } = await db
      .from("vendor_amenities")
      .insert(selectedKeys.map((amenity_key) => ({ vendor_id: vendorId, amenity_key })));
    if (error) throw new Error(error.message);
  }
  const { error } = await db
    .from("vendors")
    .update({
      capacity_max: toInteger(values.capacity_max),
      event_types: csvToArray(values.event_types),
    })
    .eq("id", vendorId);
  if (error) throw new Error(error.message);
}

export async function saveVendorTeam(vendorId: string, members: Record<string, string>[]) {
  const db = client();
  await db.from("vendor_team").delete().eq("vendor_id", vendorId);
  const rows = members
    .filter((member) => member.name.trim())
    .map((member, index) => ({
      vendor_id: vendorId,
      name: member.name.trim(),
      title: { en: member.title_en ?? member.title ?? "", es: member.title_es ?? member.title ?? "" },
      bio: { en: member.bio_en ?? member.bio ?? "", es: member.bio_es ?? member.bio ?? "" },
      headshot_url: member.headshot_url.trim() || null,
      responds_within_hours: toInteger(member.responds_within_hours),
      sort_order: index,
    }));
  if (rows.length) {
    const { error } = await db.from("vendor_team").insert(rows);
    if (error) throw new Error(error.message);
  }
}

export async function saveVendorAvailability(vendorId: string, dates: Record<string, string>[]) {
  const db = client();
  await db.from("vendor_availability").delete().eq("vendor_id", vendorId);
  const rows = dates
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date.date))
    .map((date) => ({
      vendor_id: vendorId,
      available_on: date.date,
      availability_status: date.status === "busy" ? "busy" : "available",
    }));
  if (rows.length) {
    const { error } = await db.from("vendor_availability").insert(rows);
    if (error) throw new Error(error.message);
  }
}

export async function saveVendorReviews(vendorId: string, values: Record<string, string>, currentExtraInfo: Record<string, unknown> | null) {
  const db = client();
  const nextExtra = { ...(currentExtraInfo ?? {}) };
  if (values.google_business_profile_url.trim()) {
    nextExtra.google_business_profile_url = values.google_business_profile_url.trim();
  } else {
    delete nextExtra.google_business_profile_url;
  }
  const { error } = await db
    .from("vendors")
    .update({
      review_ai_summary: values.review_ai_summary.trim() || null,
      extra_info: nextExtra,
    })
    .eq("id", vendorId);
  if (error) throw new Error(error.message);
}

export async function uploadVendorMedia(target: string, file: { uri: string; name: string; type: string }) {
  if (!mobileConfig.webApiUrl) {
    throw new Error("EXPO_PUBLIC_WEB_API_URL is not configured.");
  }
  const db = client();
  const {
    data: { session },
  } = await db.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Sign in required.");
  }

  const payload = new FormData();
  payload.append("target", target);
  const field = target === "vendor-gallery" || target === "vendor-video" ? "files" : "file";
  payload.append(field, file as unknown as Blob);

  const response = await fetch(`${mobileConfig.webApiUrl}/api/uploads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: payload,
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error ?? "Upload failed.");
  }
  return json;
}

export function uploadedAssetUrl(result: unknown) {
  if (!result || typeof result !== "object") return null;
  const record = result as Record<string, unknown>;
  const asset = record.asset;
  if (asset && typeof asset === "object") {
    const url = (asset as Record<string, unknown>).url;
    if (typeof url === "string" && url.trim()) return url;
  }
  return null;
}

"use server";

import { revalidatePath } from "next/cache";
import { UploadApiOptions, type UploadApiResponse } from "cloudinary";
import cloudinary, { isCloudinaryConfigured } from "@/lib/cloudinary";
import type { VendorImage } from "@/types/vendor";
import { getSupabaseServer } from "@/lib/supabase/server";
import { translateTextWithAI } from "@/lib/ai/translate";

// tiny helper to keep slugs URL-safe
function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseCurrencyToCents(value: string): number | null {
  if (!value) return null;
  const normalized = value.replace(/[^0-9,.-]/g, "").replace(/,/g, ".");
  const amount = Number.parseFloat(normalized);
  if (!Number.isFinite(amount)) {
    return null;
  }
  return Math.round(amount * 100);
}

function parseInteger(value: string): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

function parseCsv(input: string): string[] {
  if (!input) return [];
  return input
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function buildLocalizedField(value: string): Record<string, string> | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return { en: trimmed, es: trimmed };
}

function buildLocalizedPairValue(enValue: string, esValue: string): Record<string, string> | null {
  const result: Record<string, string> = {};
  const enTrimmed = enValue.trim();
  const esTrimmed = esValue.trim();
  if (enTrimmed) {
    result.en = enTrimmed;
  }
  if (esTrimmed) {
    result.es = esTrimmed;
  }
  return Object.keys(result).length ? result : null;
}

const PRICING_KEYS = ["reception", "ceremony", "bar", "catering"] as const;

export type SaveState = {
  ok: boolean;
  message: string;
  slug?: string;
  fieldErrors?: Record<string, string>;
};

export type ImageActionState = {
  ok: boolean;
  message: string;
};

export type FormMessageState = {
  ok: boolean;
  message: string;
};

type VendorRow = {
  id: string;
  slug: string;
  business_name: string;
  hero_image: VendorImage | null;
  thumbnail_image: VendorImage | null;
  gallery_images: VendorImage[] | null;
  extra_info: Record<string, unknown> | null;
  starting_price_currency: string | null;
  pricing_typical_spend_currency: string | null;
  pricing_peak_seasons: string[] | null;
};

export type TranslateProfileTextInput = {
  sourceText: string;
  sourceLanguageName: string;
  targetLanguageName: string;
};

export type TranslateProfileTextResult = {
  ok: boolean;
  translation?: string;
  message?: string;
};

export async function translateProfileText(
  input: TranslateProfileTextInput
): Promise<TranslateProfileTextResult> {
  try {
    const sourceText = typeof input?.sourceText === "string" ? input.sourceText : "";
    const trimmed = sourceText.trim();

    if (!trimmed) {
      return { ok: false, message: "No text provided for translation." };
    }

    const { error } = await requireAuthVendor();
    if (error) {
      return { ok: false, message: error };
    }

    const translation = await translateTextWithAI({
      text: trimmed,
      sourceLanguageName: input.sourceLanguageName,
      targetLanguageName: input.targetLanguageName,
    });

    return { ok: true, translation };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, message };
  }
}

async function requireAuthVendor() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return { supabase, error: "Not authenticated.", user: null, vendor: null } as const;
  }

  const uidArg = { _uid: user.id } satisfies { _uid: string };
  const { data: isVendor, error: roleErr } = await supabase.rpc("is_vendor", uidArg);
  if (roleErr) {
    return { supabase, error: roleErr.message, user: null, vendor: null } as const;
  }
  if (!isVendor) {
    return { supabase, error: "Vendor access required.", user: null, vendor: null } as const;
  }

  const { data: vendor } = await supabase
    .from("vendors")
    .select(
      "id, slug, business_name, hero_image, thumbnail_image, gallery_images, extra_info, starting_price_currency, pricing_typical_spend_currency, pricing_peak_seasons"
    )
    .eq("owner_id", user.id)
    .maybeSingle<VendorRow>();

  if (!vendor) {
    return { supabase, error: "Vendor profile not found.", user: null, vendor: null } as const;
  }

  return { supabase, error: null, user, vendor } as const;
}

const MAX_UPLOAD_SIZE = 12 * 1024 * 1024; // 12 MB

function mapUploadResult(result: UploadApiResponse): VendorImage {
  return {
    url: result.secure_url ?? result.url,
    public_id: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

async function uploadImageFromFile(file: File, options: UploadApiOptions) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) {
        reject(error ?? new Error("Upload failed"));
        return;
      }
      resolve(result);
    });

    uploadStream.end(buffer);
  });
}

function validateImageFile(file: File | null): string | null {
  if (!file) {
    return "Please choose an image.";
  }

  if (file.size <= 0) {
    return "The selected file is empty.";
  }

  if (!file.type.startsWith("image/")) {
    return "Unsupported file type.";
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    const mb = Math.round(MAX_UPLOAD_SIZE / (1024 * 1024));
    return `Image must be smaller than ${mb}MB.`;
  }

  return null;
}

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

    const uidArg = { _uid: user.id } satisfies { _uid: string };
    const { data: isVendor, error: roleErr } = await supabase.rpc("is_vendor", uidArg);
    if (roleErr) {
      return { ok: false, message: roleErr.message };
    }
    if (!isVendor) {
      return { ok: false, message: "Vendor access required." };
    }

    const business_name = String(formData.get("business_name") || "").trim();
    const slugRaw = String(formData.get("slug") || "").trim();
    const bio_en = String(formData.get("bio_en") || "");
    const bio_es = String(formData.get("bio_es") || "");
    const extra_info_en = String(formData.get("extra_info_en") || "");
    const extra_info_es = String(formData.get("extra_info_es") || "");

    const fieldErrors: Record<string, string> = {};
    if (!business_name) fieldErrors.business_name = "Required";
    let slug = slugRaw ? slugify(slugRaw) : slugify(business_name);
    if (!slug) fieldErrors.slug = "Slug cannot be empty";

    if (Object.keys(fieldErrors).length) {
      return { ok: false, message: "Please fix the errors.", fieldErrors };
    }

    // Do we already have a vendor for this user?
    const { data: existing } = await supabase
      .from("vendors")
      .select("id, slug, extra_info")
      .eq("owner_id", user.id)
      .maybeSingle<{ id: string; slug: string | null; extra_info: Record<string, unknown> | null }>();

    const existingExtra = (existing?.extra_info ?? {}) as Record<string, unknown>;
    const nextExtra = { ...existingExtra, en: extra_info_en, es: extra_info_es } as Record<string, unknown>;

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
        extra_info: nextExtra,
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
          extra_info: nextExtra,
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
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, message };
  }
}

export async function saveContact(
  _prevState: FormMessageState,
  formData: FormData
): Promise<FormMessageState> {
  const { supabase, vendor, error } = await requireAuthVendor();
  if (error || !vendor) {
    return { ok: false, message: error ?? "Vendor profile not found." };
  }

  const phone = String(formData.get("phone") ?? "").trim();
  const website = String(formData.get("website_url") ?? "").trim();
  const mapUrl = String(formData.get("map_url") ?? "").trim();
  const addressLabel = String(formData.get("address_label") ?? "").trim();
  const startingPriceInput = String(formData.get("starting_price") ?? "").trim();
  const startingCurrencyInput = String(formData.get("starting_price_currency") ?? "")
    .trim()
    .toUpperCase();
  const eventTypesInput = String(formData.get("event_types") ?? "");
  const yearsInBusinessInput = String(formData.get("years_in_business") ?? "");
  const languagesInput = String(formData.get("languages") ?? "");
  const teamSizeRange = String(formData.get("team_size_range") ?? "").trim();

  const startingPriceCents = parseCurrencyToCents(startingPriceInput);
  const yearsInBusiness = parseInteger(yearsInBusinessInput);
  const eventTypes = parseCsv(eventTypesInput);
  const languages = parseCsv(languagesInput);

  const updatePayload: Record<string, unknown> = {
    phone: phone || null,
    website_url: website || null,
    map_url: mapUrl || null,
    address_label: addressLabel || null,
    starting_price_cents: startingPriceCents,
    event_types: eventTypes,
    years_in_business: yearsInBusiness,
    languages,
    team_size_range: teamSizeRange || null,
  };

  if (startingCurrencyInput || startingPriceCents !== null) {
    updatePayload.starting_price_currency =
      startingCurrencyInput || vendor.starting_price_currency || "USD";
  } else {
    updatePayload.starting_price_currency = null;
  }

  const { error: updateError } = await supabase
    .from("vendors")
    .update(updatePayload)
    .eq("id", vendor.id);

  if (updateError) {
    return { ok: false, message: `Save failed: ${updateError.message}` };
  }

  revalidatePath("/vendor/profile");
  revalidatePath(`/vendors/${vendor.slug}`);
  revalidatePath("/vendors");

  return { ok: true, message: "Contact details saved." };
}

type PricingItemPayload = {
  itemKey: string;
  price?: string;
  contactForPrice?: boolean;
  notesEn?: string;
  notesEs?: string;
};

export async function savePricing(
  _prevState: FormMessageState,
  formData: FormData
): Promise<FormMessageState> {
  const { supabase, vendor, error } = await requireAuthVendor();
  if (error || !vendor) {
    return { ok: false, message: error ?? "Vendor profile not found." };
  }

  const rawItems = String(formData.get("pricing_items") ?? "").trim();
  let parsedItems: PricingItemPayload[] = [];
  if (rawItems) {
    try {
      const value = JSON.parse(rawItems);
      if (Array.isArray(value)) {
        parsedItems = value as PricingItemPayload[];
      }
    } catch {
      return { ok: false, message: "Invalid pricing data." };
    }
  }

  const normalized = new Map<string, PricingItemPayload>();
  for (const item of parsedItems) {
    if (!item || typeof item !== "object") continue;
    const key = String(item.itemKey ?? "").toLowerCase();
    if (!(PRICING_KEYS as readonly string[]).includes(key)) continue;
    normalized.set(key, {
      itemKey: key,
      price: typeof item.price === "string" ? item.price : String(item.price ?? ""),
      contactForPrice: Boolean(item.contactForPrice),
      notesEn: typeof item.notesEn === "string" ? item.notesEn : "",
      notesEs: typeof item.notesEs === "string" ? item.notesEs : "",
    });
  }

  const typicalSpendInput = String(formData.get("typical_spend") ?? "").trim();
  const typicalCurrencyInput = String(formData.get("typical_currency") ?? "")
    .trim()
    .toUpperCase();
  const peakSeasonsInput = String(formData.get("peak_seasons") ?? "");

  const typicalSpendCents = parseCurrencyToCents(typicalSpendInput);
  const peakSeasons = parseCsv(peakSeasonsInput);
  const currencyFallback =
    typicalCurrencyInput || vendor.pricing_typical_spend_currency || vendor.starting_price_currency || "USD";
  const pricingCurrency = currencyFallback;

  const upserts: {
    vendor_id: string;
    item_key: string;
    price_cents: number | null;
    currency: string;
    contact_for_price: boolean;
    notes: Record<string, string> | null;
  }[] = [];
  const deleteKeys: string[] = [];

  for (const key of PRICING_KEYS) {
    const entry = normalized.get(key) ?? null;
    const priceCents = entry && !entry.contactForPrice ? parseCurrencyToCents(entry.price ?? "") : null;
    const notes = entry ? buildLocalizedPairValue(entry.notesEn ?? "", entry.notesEs ?? "") : null;
    const hasContent = Boolean(entry?.contactForPrice) || priceCents !== null || Boolean(notes);
    if (hasContent && entry) {
      upserts.push({
        vendor_id: vendor.id,
        item_key: key,
        price_cents: priceCents,
        currency: pricingCurrency,
        contact_for_price: Boolean(entry.contactForPrice),
        notes,
      });
    } else {
      deleteKeys.push(key);
    }
  }

  if (deleteKeys.length) {
    const { error: deleteError } = await supabase
      .from("vendor_pricing")
      .delete()
      .eq("vendor_id", vendor.id)
      .in("item_key", deleteKeys);
    if (deleteError) {
      return { ok: false, message: `Save failed: ${deleteError.message}` };
    }
  }

  if (upserts.length) {
    const { error: upsertError } = await supabase
      .from("vendor_pricing")
      .upsert(upserts, { onConflict: "vendor_id,item_key" });
    if (upsertError) {
      return { ok: false, message: `Save failed: ${upsertError.message}` };
    }
  }

  const vendorUpdate: Record<string, unknown> = {
    pricing_typical_spend_cents: typicalSpendCents,
    pricing_peak_seasons: peakSeasons,
  };

  if (typicalCurrencyInput || typicalSpendCents !== null || upserts.length > 0) {
    vendorUpdate.pricing_typical_spend_currency = pricingCurrency;
  } else {
    vendorUpdate.pricing_typical_spend_currency = null;
  }

  const { error: vendorError } = await supabase
    .from("vendors")
    .update(vendorUpdate)
    .eq("id", vendor.id);

  if (vendorError) {
    return { ok: false, message: `Save failed: ${vendorError.message}` };
  }

  revalidatePath("/vendor/profile");
  revalidatePath(`/vendors/${vendor.slug}`);
  revalidatePath("/vendors");

  return { ok: true, message: "Pricing saved." };
}

export async function saveAmenities(
  _prevState: FormMessageState,
  formData: FormData
): Promise<FormMessageState> {
  const { supabase, vendor, error } = await requireAuthVendor();
  if (error || !vendor) {
    return { ok: false, message: error ?? "Vendor profile not found." };
  }

  const selectedKeys = formData
    .getAll("amenities")
    .map((value) => String(value ?? "").trim())
    .filter((value) => value.length > 0);
  const capacityMaxInput = String(formData.get("capacity_max") ?? "");
  const eventTypesInput = String(formData.get("event_types") ?? "");

  const capacityMax = parseInteger(capacityMaxInput);
  const eventTypes = parseCsv(eventTypesInput);

  const { error: deleteError } = await supabase
    .from("vendor_amenities")
    .delete()
    .eq("vendor_id", vendor.id);
  if (deleteError) {
    return { ok: false, message: `Save failed: ${deleteError.message}` };
  }

  if (selectedKeys.length) {
    const { error: insertError } = await supabase
      .from("vendor_amenities")
      .insert(selectedKeys.map((key) => ({ vendor_id: vendor.id, amenity_key: key })));
    if (insertError) {
      return { ok: false, message: `Save failed: ${insertError.message}` };
    }
  }

  const { error: updateError } = await supabase
    .from("vendors")
    .update({
      capacity_max: capacityMax,
      event_types: eventTypes,
    })
    .eq("id", vendor.id);

  if (updateError) {
    return { ok: false, message: `Save failed: ${updateError.message}` };
  }

  revalidatePath("/vendor/profile");
  revalidatePath(`/vendors/${vendor.slug}`);
  revalidatePath("/vendors");

  return { ok: true, message: "Amenities saved." };
}

type TeamPayload = {
  name?: string;
  title?: string;
  bio?: string;
  headshotUrl?: string;
  respondsWithinHours?: string;
};

export async function saveTeam(
  _prevState: FormMessageState,
  formData: FormData
): Promise<FormMessageState> {
  const { supabase, vendor, error } = await requireAuthVendor();
  if (error || !vendor) {
    return { ok: false, message: error ?? "Vendor profile not found." };
  }

  const rawTeam = String(formData.get("team") ?? "");
  let parsedTeam: TeamPayload[] = [];
  if (rawTeam) {
    try {
      const value = JSON.parse(rawTeam);
      if (Array.isArray(value)) {
        parsedTeam = value as TeamPayload[];
      }
    } catch {
      return { ok: false, message: "Invalid team data." };
    }
  }

  const members = parsedTeam
    .map((member) => ({
      name: typeof member.name === "string" ? member.name.trim() : "",
      title: typeof member.title === "string" ? member.title : "",
      bio: typeof member.bio === "string" ? member.bio : "",
      headshotUrl: typeof member.headshotUrl === "string" ? member.headshotUrl.trim() : "",
      respondsWithinHours:
        typeof member.respondsWithinHours === "string"
          ? member.respondsWithinHours
          : member.respondsWithinHours !== undefined && member.respondsWithinHours !== null
          ? String(member.respondsWithinHours)
          : "",
    }))
    .filter((member) => member.name.length > 0);

  const { error: deleteError } = await supabase
    .from("vendor_team")
    .delete()
    .eq("vendor_id", vendor.id);
  if (deleteError) {
    return { ok: false, message: `Save failed: ${deleteError.message}` };
  }

  if (members.length) {
    const insertPayload = members.map((member, index) => ({
      vendor_id: vendor.id,
      name: member.name,
      title: buildLocalizedField(member.title),
      bio: buildLocalizedField(member.bio),
      headshot_url: member.headshotUrl || null,
      responds_within_hours: parseInteger(member.respondsWithinHours),
      sort_order: index,
    }));

    const { error: insertError } = await supabase.from("vendor_team").insert(insertPayload);
    if (insertError) {
      return { ok: false, message: `Save failed: ${insertError.message}` };
    }
  }

  revalidatePath("/vendor/profile");
  revalidatePath(`/vendors/${vendor.slug}`);

  return { ok: true, message: "Team saved." };
}

export async function saveAvailability(
  _prevState: FormMessageState,
  formData: FormData
): Promise<FormMessageState> {
  const { supabase, vendor, error } = await requireAuthVendor();
  if (error || !vendor) {
    return { ok: false, message: error ?? "Vendor profile not found." };
  }

  const availabilityEn = String(formData.get("availability_en") ?? "");
  const availabilityEs = String(formData.get("availability_es") ?? "");

  const extraInfo = (vendor.extra_info ?? {}) as Record<string, unknown>;
  const nextExtra: Record<string, unknown> = { ...extraInfo };
  const availabilityValue = buildLocalizedPairValue(availabilityEn, availabilityEs);

  if (availabilityValue) {
    nextExtra.availability_note = availabilityValue;
  } else {
    delete nextExtra.availability_note;
  }

  const { error: updateError } = await supabase
    .from("vendors")
    .update({ extra_info: nextExtra })
    .eq("id", vendor.id);

  if (updateError) {
    return { ok: false, message: `Save failed: ${updateError.message}` };
  }

  revalidatePath("/vendor/profile");
  revalidatePath(`/vendors/${vendor.slug}`);

  return { ok: true, message: "Availability saved." };
}

export async function saveReviews(
  _prevState: FormMessageState,
  formData: FormData
): Promise<FormMessageState> {
  const { supabase, vendor, error } = await requireAuthVendor();
  if (error || !vendor) {
    return { ok: false, message: error ?? "Vendor profile not found." };
  }

  const summary = String(formData.get("review_summary") ?? "").trim();

  const { error: updateError } = await supabase
    .from("vendors")
    .update({ review_ai_summary: summary || null })
    .eq("id", vendor.id);

  if (updateError) {
    return { ok: false, message: `Save failed: ${updateError.message}` };
  }

  revalidatePath("/vendor/profile");
  revalidatePath(`/vendors/${vendor.slug}`);

  return { ok: true, message: "Reviews updated." };
}

function handleError(message: string): ImageActionState {
  return { ok: false, message };
}

async function ensureVendorForImages() {
  const { supabase, error, vendor } = await requireAuthVendor();
  if (error || !vendor) {
    return { supabase, vendor: null, error: error ?? "Vendor profile not found." } as const;
  }
  return { supabase, vendor, error: null } as const;
}

async function destroyPreviousAsset(publicId: string | undefined) {
  if (!publicId || !isCloudinaryConfigured) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Failed to delete Cloudinary asset", err);
    }
  }
}

export async function uploadHeroImage(
  _prev: ImageActionState,
  formData: FormData
): Promise<ImageActionState> {
  if (!isCloudinaryConfigured) {
    return handleError("Image storage is not configured.");
  }

  const fileEntry = formData.get("hero");
  if (!(fileEntry instanceof File)) {
    return handleError("Please choose an image.");
  }

  const validation = validateImageFile(fileEntry);
  if (validation) {
    return handleError(validation);
  }

  const { supabase, vendor, error } = await ensureVendorForImages();
  if (error || !vendor) {
    return handleError(error ?? "Unable to load vendor profile.");
  }

  try {
    const result = await uploadImageFromFile(fileEntry, {
      folder: `vendors/${vendor.id}/hero`,
      resource_type: "image",
      format: "webp",
      transformation: [{ width: 1920, crop: "limit" }],
    });

    const image = mapUploadResult(result);

    const { error: updateError } = await supabase
      .from("vendors")
      .update({ hero_image: image })
      .eq("id", vendor.id);

    if (updateError) {
      return handleError(`Save failed: ${updateError.message}`);
    }

    await destroyPreviousAsset(vendor.hero_image?.public_id);

    revalidatePath("/vendor/profile");
    revalidatePath(`/vendors/${vendor.slug}`);
    revalidatePath("/vendors");

    return { ok: true, message: "Hero image updated." };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return handleError(message);
  }
}

export async function uploadThumbnailImage(
  _prev: ImageActionState,
  formData: FormData
): Promise<ImageActionState> {
  if (!isCloudinaryConfigured) {
    return handleError("Image storage is not configured.");
  }

  const fileEntry = formData.get("thumbnail");
  if (!(fileEntry instanceof File)) {
    return handleError("Please choose an image.");
  }

  const validation = validateImageFile(fileEntry);
  if (validation) {
    return handleError(validation);
  }

  const { supabase, vendor, error } = await ensureVendorForImages();
  if (error || !vendor) {
    return handleError(error ?? "Unable to load vendor profile.");
  }

  try {
    const result = await uploadImageFromFile(fileEntry, {
      folder: `vendors/${vendor.id}/thumbnail`,
      resource_type: "image",
      format: "webp",
      transformation: [{ width: 600, height: 600, crop: "fill", gravity: "auto" }],
    });

    const image = mapUploadResult(result);

    const { error: updateError } = await supabase
      .from("vendors")
      .update({ thumbnail_image: image })
      .eq("id", vendor.id);

    if (updateError) {
      return handleError(`Save failed: ${updateError.message}`);
    }

    await destroyPreviousAsset(vendor.thumbnail_image?.public_id);

    revalidatePath("/vendor/profile");
    revalidatePath(`/vendors/${vendor.slug}`);
    revalidatePath("/vendors");

    return { ok: true, message: "Thumbnail image updated." };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return handleError(message);
  }
}

export async function uploadGalleryImage(
  _prev: ImageActionState,
  formData: FormData
): Promise<ImageActionState> {
  if (!isCloudinaryConfigured) {
    return handleError("Image storage is not configured.");
  }

  const fileEntries = formData
    .getAll("gallery")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (fileEntries.length === 0) {
    return handleError("Please choose at least one image.");
  }

  for (const file of fileEntries) {
    const validation = validateImageFile(file);
    if (validation) {
      return handleError(validation);
    }
  }

  const { supabase, vendor, error } = await ensureVendorForImages();
  if (error || !vendor) {
    return handleError(error ?? "Unable to load vendor profile.");
  }

  try {
    const uploads: VendorImage[] = [];
    for (const fileEntry of fileEntries) {
      const result = await uploadImageFromFile(fileEntry, {
        folder: `vendors/${vendor.id}/gallery`,
        resource_type: "image",
        format: "webp",
        transformation: [{ width: 1500, crop: "limit" }],
      });

      uploads.push(mapUploadResult(result));
    }
    const existing = Array.isArray(vendor.gallery_images) ? vendor.gallery_images : [];
    const updated = [...uploads, ...existing];

    const { error: updateError } = await supabase
      .from("vendors")
      .update({ gallery_images: updated })
      .eq("id", vendor.id);

    if (updateError) {
      return handleError(`Save failed: ${updateError.message}`);
    }

    revalidatePath("/vendor/profile");
    revalidatePath(`/vendors/${vendor.slug}`);

    const count = uploads.length;
    const plural = count === 1 ? "image" : "images";
    return { ok: true, message: `Gallery ${plural} added.` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return handleError(message);
  }
}

export async function removeGalleryImage(
  _prev: ImageActionState,
  formData: FormData
): Promise<ImageActionState> {
  const publicId = String(formData.get("public_id") || "").trim();
  if (!publicId) {
    return handleError("Missing image identifier.");
  }

  const { supabase, vendor, error } = await ensureVendorForImages();
  if (error || !vendor) {
    return handleError(error ?? "Unable to load vendor profile.");
  }

  const existing = Array.isArray(vendor.gallery_images) ? vendor.gallery_images : [];
  const updated = existing.filter((image) => image.public_id !== publicId);

  if (updated.length === existing.length) {
    return handleError("Image not found.");
  }

  const { error: updateError } = await supabase
    .from("vendors")
    .update({ gallery_images: updated })
    .eq("id", vendor.id);

  if (updateError) {
    return handleError(`Save failed: ${updateError.message}`);
  }

  if (isCloudinaryConfigured) {
    await destroyPreviousAsset(publicId);
  }

  revalidatePath("/vendor/profile");
  revalidatePath(`/vendors/${vendor.slug}`);

  return { ok: true, message: "Gallery image removed." };
}

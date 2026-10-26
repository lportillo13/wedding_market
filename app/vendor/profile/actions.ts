"use server";

import {
  prepareProfilePricing,
  profilePriceToCents,
} from "@/shared/vendors/pricing";
import { parseCalendarDate } from "@/shared/calendar/date";
import { revalidatePath } from "next/cache";
import type { VendorImage } from "@/types/vendor";
import { deleteFromR2, getOwnedR2ObjectKey } from "@/lib/r2";
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

function buildLocalizedPairValue(
  enValue: string,
  esValue: string,
): Record<string, string> | null {
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
  logo_url: string | null;
  carousel_logo_url: string | null;
  hero_image: VendorImage | null;
  thumbnail_image: VendorImage | null;
  gallery_images: VendorImage[] | null;
  extra_info: Record<string, unknown> | null;
  starting_price_currency: string | null;
  pricing_typical_spend_currency: string | null;
  pricing_peak_seasons: string[] | null;
  event_types: string[] | null;
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
  input: TranslateProfileTextInput,
): Promise<TranslateProfileTextResult> {
  try {
    const sourceText =
      typeof input?.sourceText === "string" ? input.sourceText : "";
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
    return {
      supabase,
      error: "Not authenticated.",
      user: null,
      vendor: null,
    } as const;
  }

  const uidArg = { _uid: user.id } satisfies { _uid: string };
  const { data: isVendor, error: roleErr } = await supabase.rpc(
    "is_vendor",
    uidArg,
  );
  if (roleErr) {
    return {
      supabase,
      error: roleErr.message,
      user: null,
      vendor: null,
    } as const;
  }
  if (!isVendor) {
    return {
      supabase,
      error: "Vendor access required.",
      user: null,
      vendor: null,
    } as const;
  }

  const { data: vendor } = await supabase
    .from("vendors")
    .select(
      "id, slug, business_name, logo_url, carousel_logo_url, hero_image, thumbnail_image, gallery_images, extra_info, starting_price_currency, pricing_typical_spend_currency, pricing_peak_seasons, event_types",
    )
    .eq("owner_id", user.id)
    .maybeSingle<VendorRow>();

  if (!vendor) {
    return {
      supabase,
      error: "Vendor profile not found.",
      user: null,
      vendor: null,
    } as const;
  }

  return { supabase, error: null, user, vendor } as const;
}

export async function saveProfile(
  _prevState: SaveState,
  formData: FormData,
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
    const { data: isVendor, error: roleErr } = await supabase.rpc(
      "is_vendor",
      uidArg,
    );
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
      .maybeSingle<{
        id: string;
        slug: string | null;
        extra_info: Record<string, unknown> | null;
      }>();

    const existingExtra = (existing?.extra_info ?? {}) as Record<
      string,
      unknown
    >;
    const nextExtra = {
      ...existingExtra,
      en: extra_info_en,
      es: extra_info_es,
    } as Record<string, unknown>;

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
  formData: FormData,
): Promise<FormMessageState> {
  const { supabase, vendor, error } = await requireAuthVendor();
  if (error || !vendor) {
    return { ok: false, message: error ?? "Vendor profile not found." };
  }

  const phone = String(formData.get("phone") ?? "").trim();
  const website = String(formData.get("website_url") ?? "").trim();
  const mapUrl = String(formData.get("map_url") ?? "").trim();
  const addressLabel = String(formData.get("address_label") ?? "").trim();
  const startingPriceInput = String(
    formData.get("starting_price") ?? "",
  ).trim();
  const startingCurrencyInput = String(
    formData.get("starting_price_currency") ?? "",
  )
    .trim()
    .toUpperCase();
  const eventTypesInput = String(formData.get("event_types") ?? "");
  const yearsInBusinessInput = String(formData.get("years_in_business") ?? "");
  const languagesInput = String(formData.get("languages") ?? "");
  const teamSizeRange = String(formData.get("team_size_range") ?? "").trim();

  let startingPriceCents: number | null;
  try {
    startingPriceCents = profilePriceToCents(startingPriceInput);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Invalid starting price.",
    };
  }
  if (startingCurrencyInput && !/^[A-Z]{3}$/.test(startingCurrencyInput))
    return {
      ok: false,
      message: "Use a three-letter currency code, such as USD or CRC.",
    };
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

export async function removeLogoImage(
  _state: ImageActionState,
): Promise<ImageActionState> {
  void _state;
  const { supabase, user, vendor, error } = await requireAuthVendor();
  if (error || !vendor || !user) {
    return { ok: false, message: error ?? "Vendor profile not found." };
  }

  const previousKey = vendor.logo_url
    ? getOwnedR2ObjectKey(vendor.logo_url, `vendors/${user.id}/`)
    : null;
  const previousCarouselKey = vendor.carousel_logo_url
    ? getOwnedR2ObjectKey(vendor.carousel_logo_url, `vendors/${user.id}/`)
    : null;

  const { error: updateError } = await supabase
    .from("vendors")
    .update({ logo_url: null, carousel_logo_url: null })
    .eq("id", vendor.id);

  if (updateError) {
    return { ok: false, message: `Remove failed: ${updateError.message}` };
  }

  for (const key of [previousKey, previousCarouselKey].filter(
    (value): value is string => Boolean(value),
  )) {
    try {
      await deleteFromR2(key, `vendors/${user.id}/`);
    } catch (deleteError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Failed to remove previous logo asset", deleteError);
      }
    }
  }

  revalidatePath("/vendor/profile");
  revalidatePath(`/vendors/${vendor.slug}`);
  revalidatePath("/vendors");

  return { ok: true, message: "Logo removed." };
}

export async function savePricing(
  _prevState: FormMessageState,
  formData: FormData,
): Promise<FormMessageState> {
  const { supabase, vendor, error } = await requireAuthVendor();
  if (error || !vendor)
    return { ok: false, message: error ?? "Vendor profile not found." };
  try {
    const currency = String(formData.get("typical_currency") ?? "USD")
      .trim()
      .toUpperCase();
    const rows = prepareProfilePricing(
      JSON.parse(String(formData.get("pricing_items") ?? "")),
      currency,
    );
    const { error: saveError } = await supabase.rpc("replace_vendor_section", {
      p_vendor: vendor.id,
      p_section: "pricing",
      p_rows: rows,
      p_settings: {
        pricing_typical_spend_cents: profilePriceToCents(
          String(formData.get("typical_spend") ?? ""),
        ),
        pricing_typical_spend_currency: currency,
        pricing_peak_seasons: parseCsv(
          String(formData.get("peak_seasons") ?? ""),
        ),
      },
    });
    if (saveError)
      return {
        ok: false,
        message:
          "Pricing could not be saved. Your edits are still here; please try again.",
      };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof SyntaxError
          ? "Invalid pricing data. Please reload and try again."
          : error instanceof Error
            ? error.message
            : "Invalid pricing data.",
    };
  }
  revalidatePath("/vendor/profile");
  revalidatePath(`/vendors/${vendor.slug}`);
  revalidatePath("/vendors");
  return { ok: true, message: "Pricing saved." };
}

export async function saveAmenities(
  _prevState: FormMessageState,
  formData: FormData,
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

  const capacityMax = parseInteger(capacityMaxInput);
  // Event types are edited under Contact; preserve the current saved value.
  const eventTypes = vendor.event_types ?? [];

  const { error: saveError } = await supabase.rpc("replace_vendor_section", {
    p_vendor: vendor.id,
    p_section: "amenities",
    p_rows: [...new Set(selectedKeys)].map((amenity_key) => ({ amenity_key })),
    p_settings: { capacity_max: capacityMax, event_types: eventTypes },
  });
  if (saveError)
    return {
      ok: false,
      message:
        "Services could not be saved. Your edits are still here; please try again.",
    };

  revalidatePath("/vendor/profile");
  revalidatePath(`/vendors/${vendor.slug}`);
  revalidatePath("/vendors");

  return { ok: true, message: "Amenities saved." };
}

export async function saveTeam(
  _prevState: FormMessageState,
  formData: FormData,
): Promise<FormMessageState> {
  const { supabase, vendor, error } = await requireAuthVendor();
  if (error || !vendor)
    return { ok: false, message: error ?? "Vendor profile not found." };
  try {
    const items: unknown = JSON.parse(String(formData.get("team") ?? ""));
    if (!Array.isArray(items) || items.length > 50)
      return { ok: false, message: "Add up to 50 people." };
    const rows = items.map((value, index) => {
      if (!value || typeof value !== "object")
        throw new Error("Invalid team member.");
      const member = value as Record<string, unknown>;
      if (typeof member.name !== "string" || !member.name.trim())
        throw new Error(
          "Add a name for each person, or remove the empty card.",
        );
      const text = (key: string) =>
        typeof member[key] === "string" ? (member[key] as string) : "";
      const hours = text("respondsWithinHours").trim();
      if (hours && (!/^\d+$/.test(hours) || Number(hours) > 2147483647))
        throw new Error(
          "Response time must be a whole, non-negative number of hours.",
        );
      return {
        name: member.name.trim(),
        title: buildLocalizedPairValue(text("title"), text("titleEs")),
        bio: buildLocalizedPairValue(text("bio"), text("bioEs")),
        headshot_url: text("headshotUrl").trim() || null,
        responds_within_hours: hours ? Number(hours) : null,
        sort_order: index,
      };
    });
    const { error: saveError } = await supabase.rpc("replace_vendor_section", {
      p_vendor: vendor.id,
      p_section: "team",
      p_rows: rows,
      p_settings: {},
    });
    if (saveError)
      return {
        ok: false,
        message:
          "Team could not be saved. Your edits are still here; please try again.",
      };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof SyntaxError
          ? "Invalid team data."
          : error instanceof Error
            ? error.message
            : "Invalid team data.",
    };
  }
  revalidatePath("/vendor/profile");
  revalidatePath(`/vendors/${vendor.slug}`);
  return { ok: true, message: "Team saved." };
}

export async function saveAvailability(
  _prevState: FormMessageState,
  formData: FormData,
): Promise<FormMessageState> {
  const { supabase, vendor, error } = await requireAuthVendor();
  if (error || !vendor) {
    return { ok: false, message: error ?? "Vendor profile not found." };
  }

  try {
    const parsed: unknown = JSON.parse(
      String(formData.get("availability_dates") ?? ""),
    );
    if (!Array.isArray(parsed) || parsed.length > 366)
      throw new Error("Choose up to 366 dates.");
    const dates = parsed.map((entry: unknown) => {
      if (!entry || typeof entry !== "object")
        throw new Error("Invalid availability date.");
      const record = entry as Record<string, unknown>;
      const date = typeof record.date === "string" ? record.date : "";
      if (
        !parseCalendarDate(date) ||
        (record.status !== "available" && record.status !== "busy")
      )
        throw new Error("Invalid availability date.");
      return { available_on: date, availability_status: record.status };
    });
    const rows = [
      ...new Map(dates.map((date) => [date.available_on, date])).values(),
    ];
    const { error: saveError } = await supabase.rpc("replace_vendor_section", {
      p_vendor: vendor.id,
      p_section: "availability",
      p_rows: rows,
      p_settings: {},
    });
    if (saveError)
      return {
        ok: false,
        message:
          "Dates could not be saved. Your edits are still here; please try again.",
      };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof SyntaxError
          ? "Invalid availability data."
          : error instanceof Error
            ? error.message
            : "Invalid availability data.",
    };
  }

  revalidatePath("/vendor/profile");
  revalidatePath(`/vendors/${vendor.slug}`);

  return { ok: true, message: "Availability saved." };
}

export async function saveReviews(
  _prevState: FormMessageState,
  formData: FormData,
): Promise<FormMessageState> {
  const { supabase, vendor, error } = await requireAuthVendor();
  if (error || !vendor) {
    return { ok: false, message: error ?? "Vendor profile not found." };
  }

  const summary = String(formData.get("review_summary") ?? "").trim();
  const googleBusinessUrl = String(
    formData.get("google_business_profile_url") ?? "",
  ).trim();

  const currentExtra = (vendor.extra_info ?? {}) as Record<string, unknown>;
  const nextExtra: Record<string, unknown> = { ...currentExtra };

  if (googleBusinessUrl) {
    nextExtra.google_business_profile_url = googleBusinessUrl;
  } else {
    delete nextExtra.google_business_profile_url;
  }

  const { error: updateError } = await supabase
    .from("vendors")
    .update({ review_ai_summary: summary || null, extra_info: nextExtra })
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
  const { supabase, user, error, vendor } = await requireAuthVendor();
  if (error || !vendor) {
    return {
      supabase,
      user: null,
      vendor: null,
      error: error ?? "Vendor profile not found.",
    } as const;
  }
  return { supabase, user, vendor, error: null } as const;
}

async function destroyPreviousAsset(
  publicId: string | undefined,
  ownerId: string,
) {
  if (!publicId) {
    return;
  }

  try {
    const key = getOwnedR2ObjectKey(publicId, `vendors/${ownerId}/`);
    if (key) await deleteFromR2(key, `vendors/${ownerId}/`);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Failed to delete R2 asset", err);
    }
  }
}

export async function uploadHeroImage(
  _prev: ImageActionState,
  formData: FormData,
): Promise<ImageActionState> {
  void formData;
  return handleError("Use the new upload endpoint from the profile page.");
}

export async function uploadThumbnailImage(
  _prev: ImageActionState,
  formData: FormData,
): Promise<ImageActionState> {
  void formData;
  return handleError("Use the new upload endpoint from the profile page.");
}

export async function uploadGalleryImage(
  _prev: ImageActionState,
  formData: FormData,
): Promise<ImageActionState> {
  void formData;
  return handleError("Use the new upload endpoint from the profile page.");
}

export async function removeHeroImage(
  prev: ImageActionState,
  formData: FormData,
): Promise<ImageActionState> {
  void prev;
  void formData;
  const { supabase, user, vendor, error } = await ensureVendorForImages();
  if (error || !vendor || !user) {
    return handleError(error ?? "Unable to load vendor profile.");
  }

  if (!vendor.hero_image?.public_id) {
    return handleError("Hero image not found.");
  }

  const { error: updateError } = await supabase
    .from("vendors")
    .update({ hero_image: null })
    .eq("id", vendor.id);

  if (updateError) {
    return handleError(`Save failed: ${updateError.message}`);
  }

  await destroyPreviousAsset(vendor.hero_image.public_id, user.id);
  revalidatePath("/vendor/profile");
  revalidatePath(`/vendors/${vendor.slug}`);
  revalidatePath("/vendors");
  return { ok: true, message: "Hero image removed." };
}

export async function removeThumbnailImage(
  prev: ImageActionState,
  formData: FormData,
): Promise<ImageActionState> {
  void prev;
  void formData;
  const { supabase, user, vendor, error } = await ensureVendorForImages();
  if (error || !vendor || !user) {
    return handleError(error ?? "Unable to load vendor profile.");
  }

  if (!vendor.thumbnail_image?.public_id) {
    return handleError("Thumbnail image not found.");
  }

  const { error: updateError } = await supabase
    .from("vendors")
    .update({ thumbnail_image: null })
    .eq("id", vendor.id);

  if (updateError) {
    return handleError(`Save failed: ${updateError.message}`);
  }

  await destroyPreviousAsset(vendor.thumbnail_image.public_id, user.id);
  revalidatePath("/vendor/profile");
  revalidatePath(`/vendors/${vendor.slug}`);
  revalidatePath("/vendors");
  return { ok: true, message: "Thumbnail image removed." };
}

export async function removeGalleryImage(
  _prev: ImageActionState,
  formData: FormData,
): Promise<ImageActionState> {
  const publicId = String(formData.get("public_id") || "").trim();
  if (!publicId) {
    return handleError("Missing image identifier.");
  }

  const { supabase, user, vendor, error } = await ensureVendorForImages();
  if (error || !vendor || !user) {
    return handleError(error ?? "Unable to load vendor profile.");
  }

  const existing = Array.isArray(vendor.gallery_images)
    ? vendor.gallery_images
    : [];
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

  await destroyPreviousAsset(publicId, user.id);

  revalidatePath("/vendor/profile");
  revalidatePath(`/vendors/${vendor.slug}`);

  return { ok: true, message: "Gallery image removed." };
}

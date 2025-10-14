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

type VendorRow = {
  id: string;
  slug: string;
  business_name: string;
  hero_image: VendorImage | null;
  thumbnail_image: VendorImage | null;
  gallery_images: VendorImage[] | null;
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
    .select("id, slug, business_name, hero_image, thumbnail_image, gallery_images")
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
      .select("id, slug")
      .eq("owner_id", user.id)
      .maybeSingle();

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
        extra_info: { en: extra_info_en, es: extra_info_es },
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
          extra_info: { en: extra_info_en, es: extra_info_es },
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

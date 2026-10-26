import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin/requireAdmin";
import { parseMediaAsset } from "@/lib/images";

import {
  buildStorageKey,
  processImageUpload,
  processVideoUpload,
  validateImageUpload,
  validateVideoUpload,
} from "@/features/media/server/processing";
import { deleteFromR2, getOwnedR2ObjectKey, isR2Configured, uploadToR2 } from "@/lib/r2";
import { createAuthenticatedRequestClient } from "@/lib/supabase/request";
import { readUploadForm, reserveUpload, UploadLimitError } from "@/lib/upload-limits";
import type { MediaAsset } from "@/types/images";

type UploadFormData = {
  get(name: string): FormDataEntryValue | null;
  getAll(name: string): FormDataEntryValue[];
};

async function requireUser(request: Request) {
  const supabase = await createAuthenticatedRequestClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : user };
}

async function requireVendor(auth: Awaited<ReturnType<typeof requireUser>>) {
  const { supabase, user } = auth;
  if (!user) {
    return { supabase, user: null, vendor: null, error: "Not authenticated." } as const;
  }

  const { data: isVendor, error: roleError } = await supabase.rpc("is_vendor", { _uid: user.id });
  if (roleError || !isVendor) {
    return { supabase, user, vendor: null, error: roleError?.message ?? "Vendor access required." } as const;
  }

  const { data: vendor, error: vendorError } = await supabase
    .from("vendors")
    .select("id, slug, business_name, logo_url, hero_image, thumbnail_image, gallery_images")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (vendorError || !vendor) {
    return { supabase, user, vendor: null, error: vendorError?.message ?? "Vendor profile not found." } as const;
  }

  return { supabase, user, vendor, error: null } as const;
}

async function replaceOldAsset(previous: unknown, ownerPrefix: string) {
  const asset = parseMediaAsset(previous);
  const key = asset ? getOwnedR2ObjectKey(asset.url, ownerPrefix) : null;
  if (!key) {
    return;
  }

  try {
    await deleteFromR2(key, ownerPrefix);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Failed to remove previous R2 asset", error);
    }
  }
}

async function replaceOldUrl(previousUrl: string | null | undefined, ownerPrefix: string) {
  const key = previousUrl ? getOwnedR2ObjectKey(previousUrl, ownerPrefix) : null;
  if (!key) {
    return;
  }

  try {
    await deleteFromR2(key, ownerPrefix);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Failed to remove previous R2 asset", error);
    }
  }
}

async function uploadProcessedAsset(parts: string[], processed: Awaited<ReturnType<typeof processImageUpload | typeof processVideoUpload>>) {
  const key = buildStorageKey(parts, processed.extension);
  const uploaded = await uploadToR2({
    key,
    body: processed.buffer,
    contentType: processed.contentType,
  });

  const asset: MediaAsset = {
    ...processed.asset,
    url: uploaded.url,
    public_id: key,
  };

  return asset;
}

export async function POST(request: Request) {
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "Image uploads are temporarily unavailable. Please try again later." },
      { status: 500 }
    );
  }

  // Authenticate before reading or buffering multipart data.
  const auth = await requireUser(request);
  if (!auth.user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  let release: (() => void) | undefined;
  try {
    release = reserveUpload();
    const formData = await readUploadForm(request) as UploadFormData;
    const target = String(formData.get("target") ?? "").trim();
    if (!target) return NextResponse.json({ error: "Missing upload target." }, { status: 400 });
    if (target === "client-avatar") {
      const { supabase, user } = auth;
      if (!user) {
        return NextResponse.json({ error: "You must be logged in to upload an avatar." }, { status: 401 });
      }

      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Please choose an image." }, { status: 400 });
      }

      const validation = validateImageUpload(file);
      if (validation) {
        return NextResponse.json({ error: validation }, { status: 400 });
      }

      const previous = parseMediaAsset(user.user_metadata?.avatar_image);
      const processed = await processImageUpload(file);
      const asset = await uploadProcessedAsset(["clients", user.id, "avatar"], processed);

      const { error } = await supabase.auth.updateUser({ data: { avatar_image: asset } });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (previous?.public_id !== asset.public_id) {
        await replaceOldAsset(previous, `clients/${user.id}/avatar/`);
      }

      revalidatePath("/account/profile");
      revalidatePath("/rfq/new");
      revalidatePath("/", "layout");

      return NextResponse.json({ ok: true, asset });
    }

    if (target === "vendor-logo") {
      const { supabase, user, vendor, error } = await requireVendor(auth);
      if (error || !vendor || !user) {
        return NextResponse.json({ error: error ?? "Vendor profile not found." }, { status: 401 });
      }

      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Please choose an image." }, { status: 400 });
      }

      const validation = validateImageUpload(file);
      if (validation) {
        return NextResponse.json({ error: validation }, { status: 400 });
      }

      const processed = await processImageUpload(file);
      const vendorFolder = user.id;
      const asset = await uploadProcessedAsset(["vendors", vendorFolder, "logo"], processed);

      const { error: updateError } = await supabase
        .from("vendors")
        .update({ logo_url: asset.url })
        .eq("id", vendor.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      await replaceOldUrl(vendor.logo_url, `vendors/${user.id}/`);

      revalidatePath("/vendor/profile");
      revalidatePath(`/vendors/${vendor.slug}`);
      revalidatePath("/vendors");

      return NextResponse.json({ ok: true, asset });
    }

    if (target === "vendor-team-headshot") {
      const { user, vendor, error } = await requireVendor(auth);
      if (error || !vendor || !user) {
        return NextResponse.json({ error: error ?? "Vendor profile not found." }, { status: 401 });
      }

      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Please choose an image." }, { status: 400 });
      }

      const validation = validateImageUpload(file);
      if (validation) {
        return NextResponse.json({ error: validation }, { status: 400 });
      }

      const processed = await processImageUpload(file);
      const vendorFolder = user.id;
      const asset = await uploadProcessedAsset(["vendors", vendorFolder, "team"], processed);

      return NextResponse.json({ ok: true, asset });
    }

    if (target === "vendor-hero" || target === "vendor-thumbnail") {
      const { supabase, user, vendor, error } = await requireVendor(auth);
      if (error || !vendor || !user) {
        return NextResponse.json({ error: error ?? "Vendor profile not found." }, { status: 401 });
      }

      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Please choose an image." }, { status: 400 });
      }

      const validation = validateImageUpload(file);
      if (validation) {
        return NextResponse.json({ error: validation }, { status: 400 });
      }

      const processed = await processImageUpload(file);
      const folder = target === "vendor-hero" ? "hero" : "thumbnail";
      const vendorFolder = user.id;
      const asset = await uploadProcessedAsset(["vendors", vendorFolder, folder], processed);
      const column = target === "vendor-hero" ? "hero_image" : "thumbnail_image";
      const previous = target === "vendor-hero" ? vendor.hero_image : vendor.thumbnail_image;

      const { error: updateError } = await supabase.from("vendors").update({ [column]: asset }).eq("id", vendor.id);
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      await replaceOldAsset(previous, `vendors/${user.id}/`);

      revalidatePath("/vendor/profile");
      revalidatePath(`/vendors/${vendor.slug}`);
      revalidatePath("/vendors");

      return NextResponse.json({ ok: true, asset });
    }

    if (target === "vendor-gallery" || target === "vendor-video") {
      const { supabase, user, vendor, error } = await requireVendor(auth);
      if (error || !vendor || !user) {
        return NextResponse.json({ error: error ?? "Vendor profile not found." }, { status: 401 });
      }

      const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
      if (files.length === 0) {
        return NextResponse.json({ error: "Please choose at least one file." }, { status: 400 });
      }

      const existing = Array.isArray(vendor.gallery_images) ? vendor.gallery_images : [];
      const existingPhotos = existing.filter((item) => parseMediaAsset(item)?.type !== "video");

      if (target === "vendor-gallery" && existingPhotos.length + files.length > 20) {
        return NextResponse.json({ error: "Each vendor can have a maximum of 20 photos." }, { status: 400 });
      }

      if (target === "vendor-video" && existing.length - existingPhotos.length + files.length > 3) {
        return NextResponse.json({ error: "Each vendor can have a maximum of 3 videos." }, { status: 400 });
      }
      // Validate every file before uploading the first one.
      for (const file of files) {
        const validation = target === "vendor-gallery" ? validateImageUpload(file) : validateVideoUpload(file);
        if (validation) return NextResponse.json({ error: validation }, { status: 400 });
      }
      const uploadedAssets: MediaAsset[] = [];

      let saved=false;
      try {
      for (const file of files) {
        const validation = target === "vendor-gallery" ? validateImageUpload(file) : validateVideoUpload(file);
        if (validation) {
          return NextResponse.json({ error: validation }, { status: 400 });
        }

        const processed = target === "vendor-gallery" ? await processImageUpload(file) : await processVideoUpload(file);
        const folder = target === "vendor-gallery" ? "gallery" : "videos";
        const vendorFolder = user.id;
        const asset = await uploadProcessedAsset(["vendors", vendorFolder, folder], processed);
        uploadedAssets.push(asset);
      }

      const { error: updateError } = await supabase.rpc("append_vendor_media", { p_vendor:vendor.id,p_assets:uploadedAssets });
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      saved=true;
      revalidatePath("/vendor/profile");
      revalidatePath(`/vendors/${vendor.slug}`);
      revalidatePath("/vendors");

      return NextResponse.json({ ok: true, assets: uploadedAssets });
      } finally {
        if (!saved) await Promise.allSettled(uploadedAssets.map(asset=>deleteFromR2(asset.public_id,`vendors/${user.id}/`)));
      }
    }

    if (target.startsWith("website-")) {
      const admin = await requireAdminUser();
      if (!admin) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }

      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Please choose an image." }, { status: 400 });
      }

      const validation = validateImageUpload(file);
      if (validation) {
        return NextResponse.json({ error: validation }, { status: 400 });
      }

      const processed = await processImageUpload(file);
      const folder =
        target === "website-homepage-hero"
          ? ["website", "homepage", "hero"]
          : target === "website-blog-hero"
            ? ["website", "blog", "hero"]
            : target === "website-vendor-directory-banner"
              ? ["website", "vendors", "directory-banner"]
              : target === "website-vendor-profile-banner"
                ? ["website", "vendors", "profile-banner"]
            : ["website", "blog", "blocks"];
      const asset = await uploadProcessedAsset(folder, processed);
      return NextResponse.json({ ok: true, asset });
    }

    return NextResponse.json({ error: "Unsupported upload target." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: error instanceof UploadLimitError ? error.status : 500 });
  } finally { release?.(); }
}

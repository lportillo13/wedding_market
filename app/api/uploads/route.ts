import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { requireAdminUser } from "@/lib/admin/requireAdmin";
import { parseMediaAsset } from "@/lib/images";
import { slugify } from "@/lib/slugify";
import {
  buildStorageKey,
  processImageUpload,
  processVideoUpload,
  validateImageUpload,
  validateVideoUpload,
} from "@/lib/media-processing";
import { deleteFromR2, getR2ObjectKeyFromUrl, isR2Configured, uploadToR2 } from "@/lib/r2";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { MediaAsset } from "@/types/images";

type UploadFormData = {
  get(name: string): FormDataEntryValue | null;
  getAll(name: string): FormDataEntryValue[];
};

async function requireUser() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!error && user) {
    return { supabase, user };
  }

  const authorization = await headersSafeAuthorization();
  if (!authorization) {
    return { supabase, user: null };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return { supabase, user: null };
  }

  const bearerClient = createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user: bearerUser },
  } = await bearerClient.auth.getUser();

  return { supabase: bearerClient, user: bearerUser ?? null };
}

async function headersSafeAuthorization() {
  try {
    const requestHeaders = await headers();
    const authorization = requestHeaders.get("authorization");
    return authorization?.startsWith("Bearer ") ? authorization : null;
  } catch {
    return null;
  }
}

async function requireVendor() {
  const { supabase, user } = await requireUser();
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

async function replaceOldAsset(previous: unknown) {
  const asset = parseMediaAsset(previous);
  const key = asset ? getR2ObjectKeyFromUrl(asset.url) : null;
  if (!key) {
    return;
  }

  try {
    await deleteFromR2(key);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Failed to remove previous R2 asset", error);
    }
  }
}

async function replaceOldUrl(previousUrl: string | null | undefined) {
  const key = previousUrl ? getR2ObjectKeyFromUrl(previousUrl) : null;
  if (!key) {
    return;
  }

  try {
    await deleteFromR2(key);
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
      { error: "R2 storage is not configured. Add the R2 env vars first." },
      { status: 500 }
    );
  }

  const formData = (await request.formData()) as unknown as UploadFormData;
  const target = String(formData.get("target") ?? "").trim();

  if (!target) {
    return NextResponse.json({ error: "Missing upload target." }, { status: 400 });
  }

  try {
    if (target === "client-avatar") {
      const { supabase, user } = await requireUser();
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
        await replaceOldAsset(previous);
      }

      revalidatePath("/account/profile");
      revalidatePath("/rfq/new");
      revalidatePath("/", "layout");

      return NextResponse.json({ ok: true, asset });
    }

    if (target === "vendor-logo") {
      const { supabase, vendor, error } = await requireVendor();
      if (error || !vendor) {
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
      const vendorFolder = slugify(vendor.business_name || vendor.slug || vendor.id);
      const asset = await uploadProcessedAsset(["vendors", vendorFolder, "logo"], processed);

      const { error: updateError } = await supabase
        .from("vendors")
        .update({ logo_url: asset.url })
        .eq("id", vendor.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      await replaceOldUrl(vendor.logo_url);

      revalidatePath("/vendor/profile");
      revalidatePath(`/vendors/${vendor.slug}`);
      revalidatePath("/vendors");

      return NextResponse.json({ ok: true, asset });
    }

    if (target === "vendor-team-headshot") {
      const { vendor, error } = await requireVendor();
      if (error || !vendor) {
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
      const vendorFolder = slugify(vendor.business_name || vendor.slug || vendor.id);
      const asset = await uploadProcessedAsset(["vendors", vendorFolder, "team"], processed);

      return NextResponse.json({ ok: true, asset });
    }

    if (target === "vendor-hero" || target === "vendor-thumbnail") {
      const { supabase, vendor, error } = await requireVendor();
      if (error || !vendor) {
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
      const vendorFolder = slugify(vendor.business_name || vendor.slug || vendor.id);
      const asset = await uploadProcessedAsset(["vendors", vendorFolder, folder], processed);
      const column = target === "vendor-hero" ? "hero_image" : "thumbnail_image";
      const previous = target === "vendor-hero" ? vendor.hero_image : vendor.thumbnail_image;

      const { error: updateError } = await supabase.from("vendors").update({ [column]: asset }).eq("id", vendor.id);
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      await replaceOldAsset(previous);

      revalidatePath("/vendor/profile");
      revalidatePath(`/vendors/${vendor.slug}`);
      revalidatePath("/vendors");

      return NextResponse.json({ ok: true, asset });
    }

    if (target === "vendor-gallery" || target === "vendor-video") {
      const { supabase, vendor, error } = await requireVendor();
      if (error || !vendor) {
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

      const uploadedAssets: MediaAsset[] = [];

      for (const file of files) {
        const validation = target === "vendor-gallery" ? validateImageUpload(file) : validateVideoUpload(file);
        if (validation) {
          return NextResponse.json({ error: validation }, { status: 400 });
        }

        const processed = target === "vendor-gallery" ? await processImageUpload(file) : await processVideoUpload(file);
        const folder = target === "vendor-gallery" ? "gallery" : "videos";
        const vendorFolder = slugify(vendor.business_name || vendor.slug || vendor.id);
        const asset = await uploadProcessedAsset(["vendors", vendorFolder, folder], processed);
        uploadedAssets.push(asset);
      }

      const updated = [...uploadedAssets, ...existing];
      const { error: updateError } = await supabase
        .from("vendors")
        .update({ gallery_images: updated })
        .eq("id", vendor.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      revalidatePath("/vendor/profile");
      revalidatePath(`/vendors/${vendor.slug}`);
      revalidatePath("/vendors");

      return NextResponse.json({ ok: true, assets: uploadedAssets });
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

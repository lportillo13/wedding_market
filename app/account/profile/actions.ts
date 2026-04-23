"use server";

import { revalidatePath } from "next/cache";
import { UploadApiOptions, type UploadApiResponse } from "cloudinary";
import { z } from "zod";
import cloudinary, { isCloudinaryConfigured } from "@/lib/cloudinary";
import { fillTemplate } from "@/lib/i18n";
import { getRequestI18n } from "@/lib/i18n/server";
import { parseCloudinaryImage } from "@/lib/images";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { CloudinaryImage } from "@/types/images";

export type SaveProfileState = {
  ok: boolean;
  message: string;
  fieldErrors?: FieldErrorMap;
};

type FieldErrorMap = Partial<
  Record<
    | "full_name"
    | "phone"
    | "country"
    | "tentative_wedding_date"
    | "guest_count"
    | "wedding_budget"
    | "wedding_theme"
    | "language",
    string
  >
>;

export type AvatarUploadState = {
  ok: boolean;
  message: string;
};

const MAX_AVATAR_UPLOAD_SIZE = 8 * 1024 * 1024;

type ProfileValidationLabels = {
  fullNameRequired: string;
  fullNameTooLong: string;
  phoneTooLong: string;
  countryTooLong: string;
  invalidDate: string;
  invalidGuestCount: string;
  invalidBudget: string;
  reviewForm: string;
};

type AvatarMessageLabels = {
  storageNotConfigured: string;
  chooseImage: string;
  emptyFile: string;
  unsupportedType: string;
  sizeLimit: string;
  loginRequired: string;
  updated: string;
  uploadFailed: string;
};

function createProfileSchema(labels: ProfileValidationLabels) {
  return z.object({
    full_name: z.string().trim().min(1, labels.fullNameRequired).max(200, labels.fullNameTooLong),
    phone: z.string().trim().max(40, labels.phoneTooLong).optional(),
    country: z.string().trim().max(80, labels.countryTooLong).optional(),
    tentative_wedding_date: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : null))
      .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), {
        message: labels.invalidDate,
      }),
    guest_count: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? Number.parseInt(value, 10) : null))
      .refine((value) => value === null || (Number.isInteger(value) && value > 0), {
        message: labels.invalidGuestCount,
      }),
    wedding_budget: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? Number.parseFloat(value) : null))
      .refine((value) => value === null || (!Number.isNaN(value) && value >= 0), {
        message: labels.invalidBudget,
      }),
    wedding_theme: z.string().trim().max(80).optional(),
    language: z.enum(["en", "es"]).optional().default("en"),
  });
}

function mapUploadResult(result: UploadApiResponse): CloudinaryImage {
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

function validateImageFile(
  file: File | null,
  labels: AvatarMessageLabels
) {
  if (!file) {
    return labels.chooseImage;
  }

  if (file.size <= 0) {
    return labels.emptyFile;
  }

  if (!file.type.startsWith("image/")) {
    return labels.unsupportedType;
  }

  if (file.size > MAX_AVATAR_UPLOAD_SIZE) {
    const mb = Math.round(MAX_AVATAR_UPLOAD_SIZE / (1024 * 1024));
    return fillTemplate(labels.sizeLimit, { mb });
  }

  return null;
}

async function destroyPreviousAvatar(publicId: string | undefined) {
  if (!publicId || !isCloudinaryConfigured) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Failed to remove previous avatar", error);
    }
  }
}

export async function uploadProfileAvatar(
  _prevState: AvatarUploadState,
  formData: FormData
): Promise<AvatarUploadState> {
  const { dictionary } = await getRequestI18n();
  const labels = dictionary.account.profile.avatar.messages;

  if (!isCloudinaryConfigured) {
    return { ok: false, message: labels.storageNotConfigured };
  }

  const fileEntry = formData.get("avatar");
  if (!(fileEntry instanceof File)) {
    return { ok: false, message: labels.chooseImage };
  }

  const validation = validateImageFile(fileEntry, labels);
  if (validation) {
    return { ok: false, message: validation };
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: labels.loginRequired };
  }

  const previous = parseCloudinaryImage(user.user_metadata?.avatar_image);

  try {
    const uploadResult = await uploadImageFromFile(fileEntry, {
      folder: `profiles/${user.id}/avatar`,
      resource_type: "image",
      format: "webp",
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "auto" }],
    });

    const image = mapUploadResult(uploadResult);
    const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_image: image } });

    if (updateError) {
      console.error("Failed to update user avatar metadata", updateError);
      return { ok: false, message: labels.uploadFailed };
    }

    if (previous?.public_id && previous.public_id !== image.public_id) {
      await destroyPreviousAvatar(previous.public_id);
    }

    revalidatePath("/account/profile");
    revalidatePath("/rfq/new");
    revalidatePath("/", "layout");

    return { ok: true, message: labels.updated };
  } catch (error) {
    console.error("Failed to upload profile avatar", error);
    return { ok: false, message: labels.uploadFailed };
  }
}

export async function saveProfile(
  _prevState: SaveProfileState,
  formData: FormData
): Promise<SaveProfileState> {
  const { dictionary } = await getRequestI18n();
  const formLabels = dictionary.account.profile.form;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: formLabels.messages.loginRequired };
  }

  const ProfileSchema = createProfileSchema(formLabels.validation);
  const result = ProfileSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    country: formData.get("country"),
    tentative_wedding_date: formData.get("tentative_wedding_date"),
    guest_count: formData.get("guest_count"),
    wedding_budget: formData.get("wedding_budget"),
    wedding_theme: formData.get("wedding_theme"),
    language: formData.get("language"),
  });

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const fieldErrors: FieldErrorMap = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in fieldErrors)) {
        fieldErrors[field as keyof FieldErrorMap] = issue.message;
      }
    }

    return {
      ok: false,
      message: firstIssue?.message ?? formLabels.validation.reviewForm,
      fieldErrors,
    };
  }

  const { full_name, phone, country, tentative_wedding_date, guest_count, wedding_budget, wedding_theme, language } =
    result.data;

  const updatePayload = {
    full_name,
    phone: phone || null,
    country: country || null,
    tentative_wedding_date,
    guest_count,
    wedding_budget,
    wedding_theme: wedding_theme || null,
    language,
  } satisfies Record<string, unknown>;

  const { error } = await supabase.from("profiles").update(updatePayload).eq("id", user.id);
  if (error) {
    console.error("Failed to save profile", error);
    return { ok: false, message: formLabels.messages.saveFailed };
  }

  const { error: metadataError } = await supabase.auth.updateUser({ data: { full_name } });
  if (metadataError) {
    console.error("Failed to update auth metadata for profile", metadataError);
    return { ok: false, message: formLabels.messages.saveFailed };
  }

  revalidatePath("/account/profile");
  revalidatePath("/rfq/new");
  revalidatePath("/", "layout");

  return { ok: true, message: formLabels.messages.updated };
}

"use server";

import { revalidatePath } from "next/cache";
import { UploadApiOptions, type UploadApiResponse } from "cloudinary";
import { z } from "zod";
import cloudinary, { isCloudinaryConfigured } from "@/lib/cloudinary";
import { parseCloudinaryImage } from "@/lib/images";
import type { CloudinaryImage } from "@/types/images";
import { getSupabaseServer } from "@/lib/supabase/server";
import { translateTextWithAI } from "@/lib/ai/translate";
import { supportedLanguages, isSupportedLanguage, type SupportedLanguage } from "@/lib/i18n";
import {
  PROFILE_TRANSLATION_FIELDS,
  PROFILE_LANGUAGE_NAMES,
  type ProfileTranslatableField,
} from "./translationConfig";

type SupabaseServerClient = Awaited<ReturnType<typeof getSupabaseServer>>;

const MAX_TRANSLATION_LENGTH = 2000;

const ProfileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(200, "Name is too long"),
  phone: z.string().trim().max(40, "Phone number is too long").optional(),
  country: z.string().trim().max(80, "Country name is too long").optional(),
  tentative_wedding_date: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null))
    .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: "Enter a valid date",
    }),
  guest_count: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? Number.parseInt(value, 10) : null))
    .refine((value) => value === null || (Number.isInteger(value) && value > 0), {
      message: "Enter a valid guest count",
    }),
  wedding_budget: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? Number.parseFloat(value) : null))
    .refine((value) => value === null || (!Number.isNaN(value) && value >= 0), {
      message: "Enter a valid budget",
    }),
  wedding_theme: z.string().trim().max(80).optional(),
  language: z.enum(["en", "es"]).optional().default("en"),
});

const TRANSLATABLE_FIELD_SET = new Set<string>(PROFILE_TRANSLATION_FIELDS);

type TranslationFieldErrorMap = Partial<Record<SupportedLanguage, string>>;

type TranslatableValues = Partial<Record<ProfileTranslatableField, string | null>>;

function isTranslatableField(value: unknown): value is ProfileTranslatableField {
  return typeof value === "string" && TRANSLATABLE_FIELD_SET.has(value);
}

async function upsertProfileTranslationRow(
  supabase: SupabaseServerClient,
  profileId: string,
  field: ProfileTranslatableField,
  language: SupportedLanguage,
  value: string,
  translatedVia: "manual" | "ai"
) {
  return supabase.rpc("upsert_profile_translation", {
    p_profile_id: profileId,
    p_field: field,
    p_language: language,
    p_value: value,
    p_translated_via: translatedVia,
  });
}

async function deleteProfileTranslationRow(
  supabase: SupabaseServerClient,
  profileId: string,
  field: ProfileTranslatableField,
  language: SupportedLanguage
) {
  return supabase
    .from("profile_translated_fields")
    .delete()
    .eq("profile_id", profileId)
    .eq("field", field)
    .eq("language", language);
}

async function syncDefaultProfileTranslations(
  supabase: SupabaseServerClient,
  profileId: string,
  values: TranslatableValues,
  language: SupportedLanguage
): Promise<string | null> {
  try {
    for (const field of PROFILE_TRANSLATION_FIELDS) {
      const raw = values[field];
      const value = typeof raw === "string" ? raw.trim() : "";

      if (!value) {
        const { error } = await deleteProfileTranslationRow(supabase, profileId, field, language);
        if (error) {
          return error.message;
        }
        continue;
      }

      const { error } = await upsertProfileTranslationRow(supabase, profileId, field, language, value, "manual");
      if (error) {
        return error.message;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return message;
  }

  return null;
}

export type SaveProfileState = {
  ok: boolean;
  message: string;
  fieldErrors?: FieldErrorMap;
};

type FieldErrorMap = Partial<Record<keyof z.infer<typeof ProfileSchema>, string>>;

export type AvatarUploadState = {
  ok: boolean;
  message: string;
};

export type SaveFieldTranslationsState = {
  ok: boolean;
  message: string;
  translations?: Partial<Record<SupportedLanguage, string>>;
  fieldErrors?: TranslationFieldErrorMap;
  errorCode?: "validation" | "auth" | "unknown";
};

export type AutoTranslateProfileFieldInput = {
  field: ProfileTranslatableField;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  sourceText: string;
};

export type AutoTranslateProfileFieldResult = {
  ok: boolean;
  message: string;
  translations?: Partial<Record<SupportedLanguage, string>>;
  sourceLanguage?: SupportedLanguage;
  targetLanguage?: SupportedLanguage;
  errorCode?: "not_configured" | "empty_source" | "auth" | "validation" | "unknown";
};

const MAX_AVATAR_UPLOAD_SIZE = 8 * 1024 * 1024; // 8 MB

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

  if (file.size > MAX_AVATAR_UPLOAD_SIZE) {
    const mb = Math.round(MAX_AVATAR_UPLOAD_SIZE / (1024 * 1024));
    return `Image must be smaller than ${mb}MB.`;
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
  if (!isCloudinaryConfigured) {
    return { ok: false, message: "Image storage is not configured." };
  }

  const fileEntry = formData.get("avatar");
  if (!(fileEntry instanceof File)) {
    return { ok: false, message: "Please choose an image." };
  }

  const validation = validateImageFile(fileEntry);
  if (validation) {
    return { ok: false, message: validation };
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "You must be logged in to update your profile." };
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
      return { ok: false, message: updateError.message };
    }

    if (previous?.public_id && previous.public_id !== image.public_id) {
      await destroyPreviousAvatar(previous.public_id);
    }

    revalidatePath("/account/profile");
    revalidatePath("/rfq/new");
    revalidatePath("/", "layout");

    return { ok: true, message: "Profile photo updated." };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message };
  }
}

export async function saveProfile(
  _prevState: SaveProfileState,
  formData: FormData
): Promise<SaveProfileState> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "You must be logged in to update your profile." };
  }

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
      message: firstIssue?.message ?? "Please review the form",
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

  const { error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  const translationError = await syncDefaultProfileTranslations(
    supabase,
    user.id,
    {
      full_name,
      country: country || null,
      wedding_theme: wedding_theme || null,
    },
    language
  );

  if (translationError) {
    return { ok: false, message: translationError };
  }

  const { error: metadataError } = await supabase.auth.updateUser({ data: { full_name } });
  if (metadataError) {
    return { ok: false, message: metadataError.message };
  }

  revalidatePath("/account/profile");
  revalidatePath("/rfq/new");
  revalidatePath("/", "layout");

  return { ok: true, message: "Profile updated successfully." };
}

export async function saveProfileTranslations(
  field: ProfileTranslatableField,
  _prevState: SaveFieldTranslationsState,
  formData: FormData
): Promise<SaveFieldTranslationsState> {
  if (!isTranslatableField(field)) {
    return { ok: false, message: "Unsupported field.", errorCode: "validation" };
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "You must be logged in to update translations.", errorCode: "auth" };
  }

  const translations: Partial<Record<SupportedLanguage, string>> = {};
  const fieldErrors: TranslationFieldErrorMap = {};

  for (const language of supportedLanguages) {
    const raw = formData.get(`value_${language}`);
    if (typeof raw !== "string") {
      continue;
    }

    const trimmed = raw.trim();
    translations[language] = trimmed;

    if (trimmed.length > MAX_TRANSLATION_LENGTH) {
      fieldErrors[language] = `Translation must be ${MAX_TRANSLATION_LENGTH} characters or fewer.`;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "Please fix the highlighted translations.",
      translations,
      fieldErrors,
      errorCode: "validation",
    };
  }

  try {
    for (const language of supportedLanguages) {
      const value = translations[language];
      if (typeof value === "string" && value.length > 0) {
        const { error } = await upsertProfileTranslationRow(supabase, user.id, field, language, value, "manual");
        if (error) {
          throw error;
        }
      } else {
        const { error } = await deleteProfileTranslationRow(supabase, user.id, field, language);
        if (error) {
          throw error;
        }
        translations[language] = "";
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message, translations, errorCode: "unknown" };
  }

  revalidatePath("/account/profile");

  return { ok: true, message: "Translations saved.", translations };
}

export async function autoTranslateProfileField(
  input: AutoTranslateProfileFieldInput
): Promise<AutoTranslateProfileFieldResult> {
  const { field, sourceLanguage, targetLanguage, sourceText } = input;

  if (!isTranslatableField(field)) {
    return { ok: false, message: "Unsupported field.", errorCode: "validation" };
  }

  if (!isSupportedLanguage(sourceLanguage) || !isSupportedLanguage(targetLanguage)) {
    return { ok: false, message: "Unsupported language.", errorCode: "validation" };
  }

  if (sourceLanguage === targetLanguage) {
    return { ok: false, message: "Choose a different target language.", errorCode: "validation" };
  }

  const trimmedSource = sourceText.trim();
  if (!trimmedSource) {
    return {
      ok: false,
      message: "Enter text to translate first.",
      errorCode: "empty_source",
      sourceLanguage,
      targetLanguage,
    };
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "You must be logged in to translate this field.", errorCode: "auth" };
  }

  const sourceSave = await upsertProfileTranslationRow(supabase, user.id, field, sourceLanguage, trimmedSource, "manual");
  if (sourceSave.error) {
    return {
      ok: false,
      message: sourceSave.error.message,
      errorCode: "unknown",
      translations: { [sourceLanguage]: trimmedSource },
      sourceLanguage,
      targetLanguage,
    };
  }

  let translatedText: string;

  try {
    const sourceName = PROFILE_LANGUAGE_NAMES[sourceLanguage] ?? sourceLanguage;
    const targetName = PROFILE_LANGUAGE_NAMES[targetLanguage] ?? targetLanguage;
    translatedText = await translateTextWithAI({
      text: trimmedSource,
      sourceLanguageName: sourceName,
      targetLanguageName: targetName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      message,
      translations: { [sourceLanguage]: trimmedSource },
      sourceLanguage,
      targetLanguage,
      errorCode: message === "AI translation is not configured." ? "not_configured" : "unknown",
    };
  }

  const cleanedTranslation = translatedText.trim();
  if (!cleanedTranslation) {
    return {
      ok: false,
      message: "Translation service did not return text.",
      translations: { [sourceLanguage]: trimmedSource },
      sourceLanguage,
      targetLanguage,
      errorCode: "unknown",
    };
  }

  const targetSave = await upsertProfileTranslationRow(
    supabase,
    user.id,
    field,
    targetLanguage,
    cleanedTranslation,
    "ai"
  );

  if (targetSave.error) {
    return {
      ok: false,
      message: targetSave.error.message,
      translations: { [sourceLanguage]: trimmedSource },
      sourceLanguage,
      targetLanguage,
      errorCode: "unknown",
    };
  }

  revalidatePath("/account/profile");

  return {
    ok: true,
    message: "Translation saved.",
    translations: {
      [sourceLanguage]: trimmedSource,
      [targetLanguage]: cleanedTranslation,
    },
    sourceLanguage,
    targetLanguage,
  };
}

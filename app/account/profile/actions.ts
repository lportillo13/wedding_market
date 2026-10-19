"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRequestI18n } from "@/lib/i18n/server";
import { getSupabaseServer } from "@/lib/supabase/server";

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

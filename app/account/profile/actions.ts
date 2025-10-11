"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";

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

export type SaveProfileState = {
  ok: boolean;
  message: string;
  fieldErrors?: FieldErrorMap;
};

type FieldErrorMap = Partial<Record<keyof z.infer<typeof ProfileSchema>, string>>;

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

  revalidatePath("/account/profile");
  revalidatePath("/rfq/new");

  return { ok: true, message: "Profile updated successfully." };
}

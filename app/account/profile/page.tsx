import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupportedLanguage, supportedLanguages, type SupportedLanguage } from "@/lib/i18n";
import { parseCloudinaryImage } from "@/lib/images";
import ProfilePageContent from "./ProfilePageContent";
import type { ProfileFormInitial } from "./profileForm";
import {
  createEmptyProfileTranslations,
  PROFILE_TRANSLATION_FIELDS,
  type ProfileTranslationsByField,
  type ProfileTranslatableField,
} from "./translationConfig";

export default async function AccountProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <ProfilePageContent initial={null} avatarImage={null} translations={null} />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, phone, country, tentative_wedding_date, guest_count, wedding_budget, wedding_theme, language"
    )
    .eq("id", user.id)
    .maybeSingle();

  const { data: translationRows } = await supabase
    .from("profile_translated_fields")
    .select("field, language, value")
    .eq("profile_id", user.id);

  const initial: ProfileFormInitial = {
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    email: user.email ?? "",
    country: profile?.country ?? "",
    tentative_wedding_date: profile?.tentative_wedding_date ?? "",
    guest_count: profile?.guest_count ?? null,
    wedding_budget: profile?.wedding_budget ?? null,
    wedding_theme: profile?.wedding_theme ?? "",
    language: isSupportedLanguage(profile?.language) ? profile.language : "en",
  };

  const translations: ProfileTranslationsByField = createEmptyProfileTranslations();

  type TranslationRow = { field: string | null; language: string | null; value: string | null };

  for (const row of (translationRows ?? []) as TranslationRow[]) {
    const field = row.field;
    const language = row.language as SupportedLanguage | null;

    if (!field || !isSupportedLanguage(language)) {
      continue;
    }

    if ((PROFILE_TRANSLATION_FIELDS as readonly string[]).includes(field)) {
      translations[field as ProfileTranslatableField][language] = row.value ?? "";
    }
  }

  const translatableBaseValues: Partial<Record<ProfileTranslatableField, string | null>> = {
    full_name: profile?.full_name ?? null,
    country: profile?.country ?? null,
    wedding_theme: profile?.wedding_theme ?? null,
  };

  const defaultLanguage = initial.language;

  for (const field of PROFILE_TRANSLATION_FIELDS) {
    const baseValue = translatableBaseValues[field];
    if (baseValue && !translations[field][defaultLanguage]) {
      translations[field][defaultLanguage] = baseValue;
    }

    for (const language of supportedLanguages) {
      if (typeof translations[field][language] !== "string") {
        translations[field][language] = "";
      }
    }
  }

  const avatarImage = parseCloudinaryImage(user.user_metadata?.avatar_image);

  return <ProfilePageContent initial={initial} avatarImage={avatarImage} translations={translations} />;
}

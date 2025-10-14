import type { SupportedLanguage } from "@/lib/i18n";

export const PROFILE_TRANSLATION_FIELDS = ["full_name", "country", "wedding_theme"] as const;

export type ProfileTranslatableField = (typeof PROFILE_TRANSLATION_FIELDS)[number];

export type ProfileTranslationsByField = {
  [Field in ProfileTranslatableField]: Partial<Record<SupportedLanguage, string>>;
};

export function createEmptyProfileTranslations(): ProfileTranslationsByField {
  return PROFILE_TRANSLATION_FIELDS.reduce((acc, field) => {
    acc[field] = {};
    return acc;
  }, {} as ProfileTranslationsByField);
}

export const PROFILE_LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: "English",
  es: "Spanish",
};

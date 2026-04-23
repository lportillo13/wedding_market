import { cookies } from "next/headers";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  dictionaries,
  getLanguageLocale,
  isSupportedLanguage,
  type SupportedLanguage,
} from "@/lib/i18n";

export async function getRequestLanguage(fallbackLanguage: SupportedLanguage = DEFAULT_LANGUAGE) {
  const cookieStore = await cookies();
  const cookieLanguage = cookieStore.get(LANGUAGE_COOKIE_NAME)?.value;

  if (isSupportedLanguage(cookieLanguage)) {
    return cookieLanguage;
  }

  return fallbackLanguage;
}

export async function getRequestI18n(fallbackLanguage: SupportedLanguage = DEFAULT_LANGUAGE) {
  const language = await getRequestLanguage(fallbackLanguage);

  return {
    language,
    locale: getLanguageLocale(language),
    dictionary: dictionaries[language],
  };
}

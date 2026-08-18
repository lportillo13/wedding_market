import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales, type Locale } from "expo-localization";

export type AppLanguage = "en" | "es";

const LANGUAGE_PREFERENCE_KEY = "wedding-market:language";

export function languageFromLocales(locales: Pick<Locale, "languageCode" | "languageTag">[]): AppLanguage {
  const primaryLocale = locales[0];
  const languageCode = primaryLocale?.languageCode?.toLowerCase();
  const languageTag = primaryLocale?.languageTag?.toLowerCase();
  return languageCode === "es" || languageTag === "es" || languageTag?.startsWith("es-") ? "es" : "en";
}

export function getDeviceLanguage(): AppLanguage {
  return languageFromLocales(getLocales());
}

export async function loadLanguagePreference(): Promise<AppLanguage> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_PREFERENCE_KEY);
    if (stored === "en" || stored === "es") return stored;
  } catch {
    // A storage failure should not prevent the app from starting in the phone language.
  }

  const deviceLanguage = getDeviceLanguage();
  await saveLanguagePreference(deviceLanguage);
  return deviceLanguage;
}

export async function saveLanguagePreference(language: AppLanguage) {
  try {
    await AsyncStorage.setItem(LANGUAGE_PREFERENCE_KEY, language);
  } catch {
    // The in-memory language still applies for this session if storage is unavailable.
  }
}

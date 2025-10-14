import en from "@/locales/en/common";
import es from "@/locales/es/common";

export const dictionaries = {
  en,
  es,
} as const;

export type SupportedLanguage = keyof typeof dictionaries;

export const supportedLanguages = Object.keys(dictionaries) as SupportedLanguage[];

export type CommonDictionary = (typeof dictionaries)[SupportedLanguage];

type Join<K, P> = K extends string
  ? P extends string
    ? `${K}.${P}`
    : never
  : never;

type Leaves<T> = T extends string
  ? ""
  : {
      [K in keyof T]: T[K] extends string
        ? Extract<K, string>
        : Join<Extract<K, string>, Leaves<T[K]>>;
    }[keyof T];

export type TranslationKey = Exclude<Leaves<typeof en>, "">;

export function translate(dictionary: CommonDictionary, key: TranslationKey): string {
  const segments = key.split(".");
  let current: unknown = dictionary;

  for (const segment of segments) {
    if (typeof current !== "object" || current === null || !(segment in current)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`Missing translation for key "${key}"`);
      }
      return key;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  if (typeof current === "string") {
    return current;
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn(`Translation key "${key}" did not resolve to a string`);
  }

  return key;
}

export function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return value === "en" || value === "es";
}

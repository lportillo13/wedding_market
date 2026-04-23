"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  LANGUAGE_STORAGE_KEY,
  dictionaries,
  isSupportedLanguage,
  translate,
  type SupportedLanguage,
  type TranslationKey,
} from "@/lib/i18n";

type LanguageContextValue = {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  translate: (key: TranslationKey) => string;
  dictionary: (typeof dictionaries)[SupportedLanguage];
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function readPersistedLanguage(): SupportedLanguage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupportedLanguage(stored)) {
      return stored;
    }
  } catch {
    // Ignore storage access failures and fall back to the cookie.
  }

  const cookieMatch = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${LANGUAGE_COOKIE_NAME}=`));
  const cookieValue = cookieMatch?.split("=")[1];

  return isSupportedLanguage(cookieValue) ? cookieValue : null;
}

export function LanguageProvider({ children, initialLanguage }: { children: ReactNode; initialLanguage?: SupportedLanguage }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    return readPersistedLanguage() ?? initialLanguage ?? DEFAULT_LANGUAGE;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Ignore storage write failures and rely on the cookie for persistence.
    }

    document.cookie = `${LANGUAGE_COOKIE_NAME}=${language}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((value: SupportedLanguage) => {
    setLanguageState(value);
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const dictionary = dictionaries[language];
    return {
      language,
      setLanguage,
      translate: (key: TranslationKey) => translate(dictionary, key),
      dictionary,
    };
  }, [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export function useTranslation() {
  const { translate } = useLanguage();
  return translate;
}

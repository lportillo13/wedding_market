"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { dictionaries, isSupportedLanguage, translate, type SupportedLanguage, type TranslationKey } from "@/lib/i18n";

const LANGUAGE_STORAGE_KEY = "wm-language";

type LanguageContextValue = {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  translate: (key: TranslationKey) => string;
  dictionary: (typeof dictionaries)[SupportedLanguage];
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children, initialLanguage }: { children: ReactNode; initialLanguage?: SupportedLanguage }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window === "undefined") {
      return initialLanguage ?? "en";
    }

    if (initialLanguage) {
      return initialLanguage;
    }

    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupportedLanguage(stored)) {
      return stored;
    }

    return "en";
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
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

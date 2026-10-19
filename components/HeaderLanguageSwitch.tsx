"use client";
import { useLanguage } from "@/contexts/LanguageContext";
export default function HeaderLanguageSwitch({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { language, setLanguage, dictionary } = useLanguage();
  return (
    <div
      className={`wm-header-language${compact ? " wm-header-language--compact" : ""}`}
      role="group"
      aria-label={dictionary.languageSelector.label}
    >
      {(["en", "es"] as const).map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={language === code}
          aria-label={
            code === "en"
              ? dictionary.languageSelector.english
              : dictionary.languageSelector.spanish
          }
          onClick={() => setLanguage(code)}
        >
          {compact ? code.toUpperCase() : code === "en" ? "English" : "Español"}
        </button>
      ))}
    </div>
  );
}

"use client";

/* The two pre-sized local images use picture for a separate, small phone crop. */
import type { ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function EditorialAuthLayout({ children, onboarding = false, vendor = false }: { children: ReactNode; onboarding?: boolean; vendor?: boolean }) {
  const { language, setLanguage, dictionary } = useLanguage();
  const copy = dictionary.login.editorial;

  return (
    <main className={`wm-auth-editorial${onboarding ? ' wm-auth-editorial--onboarding' : ''}`}>
      <div className="wm-auth-editorial__visual" aria-hidden="true">
        <picture>
          <source media="(max-width: 767.98px)" srcSet="/images/auth-editorial-welcome-mobile.webp" />
          <img src="/images/auth-editorial-welcome.webp" width="1536" height="1024" alt="" fetchPriority="high" />
        </picture>
        <p className="wm-auth-editorial__caption">{vendor ? dictionary.signup.journey.vendorPhotoTitle : copy.photoTitle}<em>{vendor ? dictionary.signup.journey.vendorPhotoAccent : copy.photoAccent}</em></p>
      </div>
      <div className="wm-auth-editorial__content">
        <div className="wm-auth-editorial__inner">
          <div className="wm-auth-editorial__languages" role="group" aria-label={copy.languageLabel}>
            <button type="button" lang="en" aria-label="English" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button>
            <span aria-hidden="true">/</span>
            <button type="button" lang="es" aria-label="Español" aria-pressed={language === "es"} onClick={() => setLanguage("es")}>ES</button>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}

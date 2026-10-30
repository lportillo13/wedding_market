"use client";

/* The two pre-sized local images use picture for a separate, small phone crop. */
import type { ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function EditorialAuthLayout({ children, onboarding = false, vendor = false }: { children: ReactNode; onboarding?: boolean; vendor?: boolean }) {
  const { dictionary } = useLanguage();
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
          {children}
        </div>
      </div>
    </main>
  );
}

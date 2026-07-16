"use client";

import { useEffect, useMemo, useState } from "react";
import CategoriesSection from "@/components/home/CategoriesSection";
import DigitalMagazineSection from "@/components/home/DigitalMagazineSection";
import EditorialFeaturesSection from "@/components/home/EditorialFeaturesSection";
import FoundersHeroSection from "@/components/home/FoundersHeroSection";
import HomeNavigation from "@/components/home/HomeNavigation";
import PremiumProcessSection from "@/components/home/PremiumProcessSection";
import SponsoredSection from "@/components/home/SponsoredSection";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDefaultHomepageContent, type HomepageContent } from "@/lib/content/siteContent";

export default function Home() {
  const { language } = useLanguage();
  const fallbackContent = useMemo(() => getDefaultHomepageContent(language), [language]);
  const [managedContent, setManagedContent] = useState<{
    language: string;
    value: HomepageContent;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadManagedContent() {
      try {
        const response = await fetch(`/api/content/site-settings?lang=${encodeURIComponent(language)}`, {
          cache: "no-store",
        });

        if (!response.ok) return;

        const payload = (await response.json()) as { homepage?: HomepageContent };
        if (!cancelled && payload.homepage) {
          setManagedContent({ language, value: payload.homepage });
        }
      } catch {
        if (!cancelled) setManagedContent(null);
        // Keep locale defaults when managed content is unavailable.
      }
    }

    void loadManagedContent();
    return () => {
      cancelled = true;
    };
  }, [language]);

  const content = managedContent?.language === language ? managedContent.value : fallbackContent;
  const { hero, categories, plan } = content;

  return (
    <main className="wm-site-page wm-home-premium">
      <HomeNavigation categoryItems={categories.items} />
      <FoundersHeroSection hero={hero} />
      <SponsoredSection hero={hero} categories={categories} />
      <EditorialFeaturesSection />
      <CategoriesSection categories={categories} language={language} />
      <DigitalMagazineSection />
      <PremiumProcessSection plan={plan} />
    </main>
  );
}

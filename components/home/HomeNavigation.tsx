"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import HeroNavActions from "@/components/HeroNavActions";
import VendorsMegaMenu, { type HeaderVendorCategory } from "@/components/VendorsMegaMenu";
import { useLanguage } from "@/contexts/LanguageContext";
import type { HomepageCategoryItem } from "@/lib/content/siteContent";

type HomeNavigationProps = {
  categoryItems: HomepageCategoryItem[];
};

export default function HomeNavigation({ categoryItems }: HomeNavigationProps) {
  const { dictionary } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const vendorCategories = useMemo<HeaderVendorCategory[]>(
    () =>
      categoryItems.map((category) => ({
        key: category.slug,
        label: {
          en: category.label,
          es: category.label,
        },
      })),
    [categoryItems],
  );

  useEffect(() => {
    const updateScrollState = () => setIsScrolled(window.scrollY > 24);

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 992px)");
    const syncNavigationMode = (event: MediaQueryList | MediaQueryListEvent) => {
      if (event.matches) setIsOpen(false);
    };

    syncNavigationMode(mediaQuery);
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncNavigationMode);
      return () => mediaQuery.removeEventListener("change", syncNavigationMode);
    }

    mediaQuery.addListener(syncNavigationMode);
    return () => mediaQuery.removeListener(syncNavigationMode);
  }, []);

  return (
    <nav
      className={`wm-founders-hero__nav${isScrolled ? " wm-founders-hero__nav--scrolled" : ""}${isOpen ? " is-open" : ""}`}
      aria-label="Primary navigation"
    >
      <button
        type="button"
        className="wm-founders-hero__mobile-toggle"
        aria-controls="wmHeroNavLinks"
        aria-expanded={isOpen}
        aria-label="Toggle navigation"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>

      <ul id="wmHeroNavLinks" className={`wm-founders-hero__nav-links${isOpen ? " is-open" : ""}`}>
        <VendorsMegaMenu categories={vendorCategories} closeMobileNav={() => setIsOpen(false)} />
        <li className="nav-item">
          <Link href="/about" className="nav-link" onClick={() => setIsOpen(false)}>
            {dictionary.nav.about}
          </Link>
        </li>
        <li className="nav-item">
          <Link href="/blog" className="nav-link" onClick={() => setIsOpen(false)}>
            {dictionary.nav.blog}
          </Link>
        </li>
      </ul>

      <Link href="/" className="wm-founders-hero__brand">
        <span>{dictionary.nav.brand}</span>
      </Link>
      <HeroNavActions />
    </nav>
  );
}

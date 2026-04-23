"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getShortlistCount } from "@/lib/shortlist";
import { useTranslation } from "@/contexts/LanguageContext";
import LanguageDropdown from "@/components/LanguageDropdown";
import VendorsMegaMenu, { type HeaderVendorCategory } from "@/components/VendorsMegaMenu";

type NavBarProps = {
  authMenu?: ReactNode;
  isAuthenticated?: boolean;
  isVendor?: boolean;
  notificationLink?: ReactNode;
  vendorCategories: HeaderVendorCategory[];
};

export default function NavBar({
  authMenu,
  isAuthenticated = false,
  isVendor = false,
  notificationLink,
  vendorCategories,
}: NavBarProps) {
  const [count, setCount] = useState(() => (typeof window !== "undefined" ? getShortlistCount() : 0));
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const sync = () => setCount(getShortlistCount());
    window.addEventListener("wm-shortlist-changed", sync);
    return () => window.removeEventListener("wm-shortlist-changed", sync);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 992px)");
    const updateIsLargeScreen = (event: MediaQueryList | MediaQueryListEvent) => {
      setIsLargeScreen(event.matches);
    };

    updateIsLargeScreen(mediaQuery);
    const listener = (event: MediaQueryListEvent) => updateIsLargeScreen(event);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }

    mediaQuery.addListener(listener);
    return () => mediaQuery.removeListener(listener);
  }, []);

  useEffect(() => {
    if (!isLargeScreen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(false);
    }
  }, [pathname, isLargeScreen]);

  const navExpanded = isLargeScreen || isOpen;
  const t = useTranslation();
  const closeMobileNav = () => setIsOpen(false);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm wm-navbar-shell wm-site-navbar">
      <div className="container position-relative">
        <Link href="/" className="navbar-brand">{t("nav.brand")}</Link>

        <button
          className="navbar-toggler"
          type="button"
          aria-controls="wmNav"
          aria-expanded={navExpanded}
          aria-label="Toggle navigation"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse${navExpanded ? " show" : ""}`} id="wmNav">
          <ul className="navbar-nav me-auto">
            <VendorsMegaMenu categories={vendorCategories} closeMobileNav={closeMobileNav} />
            <li className="nav-item"><Link href="/about" className="nav-link">{t("nav.about")}</Link></li>
            <li className="nav-item"><Link href="/blog" className="nav-link">{t("nav.blog")}</Link></li>
            {isAuthenticated && !isVendor && (
              <li className="nav-item"><Link href="/account/inbox" className="nav-link">{t("nav.myRequests")}</Link></li>
            )}
            {isAuthenticated && isVendor && (
              <li className="nav-item"><Link href="/vendor/inbox" className="nav-link">{t("vendorRfqs.title")}</Link></li>
            )}
          </ul>

          <div className="wm-navbar-actions d-flex align-items-center gap-2 flex-wrap flex-lg-nowrap ms-lg-auto">
            {!isVendor && (
              <Link href="/rfq/new" className="btn btn-primary btn-sm wm-header-action">
                {t("nav.requestQuotes")}
              </Link>
            )}
            {notificationLink}
            {isAuthenticated && !isVendor && (
              <Link
                href="/shortlist"
                className="btn btn-outline-secondary btn-sm position-relative d-inline-flex align-items-center justify-content-center wm-header-action wm-header-action--icon"
                aria-label={t("nav.shortlist")}
                title={t("nav.shortlist")}
                style={{ padding: 0 }}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m12 21-1.4-1.3C5.4 14.9 2 11.8 2 8a5 5 0 0 1 9.1-2.9L12 6.3l.9-1.2A5 5 0 0 1 22 8c0 3.8-3.4 6.9-8.6 11.7z" />
                </svg>
                <span className="visually-hidden">{t("nav.shortlist")}</span>
                {/* render badge after mount to avoid hydration mismatch */}
                {mounted && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {count}
                    <span className="visually-hidden">{t("nav.shortlistCountLabel")}</span>
                  </span>
                )}
              </Link>
            )}
            {!isAuthenticated && <LanguageDropdown />}
            {authMenu}
          </div>
        </div>
      </div>
    </nav>
  );
}

"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getShortlistCount } from "@/lib/shortlist";
import { useTranslation } from "@/contexts/LanguageContext";
import LanguageDropdown from "@/components/LanguageDropdown";

export default function NavBar({ authMenu }: { authMenu?: ReactNode }) {
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

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
      <div className="container">
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
            <li className="nav-item"><Link href="/vendors" className="nav-link">{t("nav.vendors")}</Link></li>
            <li className="nav-item"><Link href="/account/rfqs" className="nav-link">{t("nav.myRequests")}</Link></li>
          </ul>

          <div className="d-flex align-items-center gap-2 flex-wrap flex-lg-nowrap ms-lg-auto">
            <Link href="/rfq/new" className="btn btn-primary btn-sm">
              {t("nav.requestQuotes")}
            </Link>
            <Link href="/shortlist" className="btn btn-outline-secondary btn-sm position-relative">
              {t("nav.shortlist")}
              {/* render badge after mount to avoid hydration mismatch */}
              {mounted && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {count}
                  <span className="visually-hidden">{t("nav.shortlistCountLabel")}</span>
                </span>
              )}
            </Link>
            <LanguageDropdown />
            {authMenu}
          </div>
        </div>
      </div>
    </nav>
  );
}

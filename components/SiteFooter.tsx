"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLanguage, useTranslation } from "@/contexts/LanguageContext";
import type { HeaderVendorCategory } from "@/components/VendorsMegaMenu";

type SiteFooterProps = {
  vendorCategories: HeaderVendorCategory[];
};

type FooterMenuId = "navigation" | "contact" | "socials";

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.636 5.903-5.636Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function IconPinterest() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.04-2.83.18-.76 1.22-5.16 1.22-5.16s-.31-.63-.31-1.56c0-1.46.85-2.55 1.9-2.55.9 0 1.33.67 1.33 1.48 0 .9-.58 2.25-.87 3.5-.25 1.05.52 1.9 1.54 1.9 1.85 0 3.09-2.37 3.09-5.18 0-2.14-1.44-3.64-3.5-3.64-2.39 0-3.79 1.79-3.79 3.64 0 .72.28 1.49.62 1.91.07.08.08.15.06.24-.06.26-.2.84-.23.96-.04.15-.13.18-.3.11-1.12-.52-1.82-2.17-1.82-3.49 0-2.84 2.06-5.44 5.94-5.44 3.12 0 5.55 2.22 5.55 5.19 0 3.1-1.95 5.59-4.65 5.59-.91 0-1.76-.47-2.05-1.03l-.56 2.09c-.2.78-.75 1.75-1.12 2.34.85.26 1.74.4 2.67.4 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
    </svg>
  );
}

export default function SiteFooter({ vendorCategories }: SiteFooterProps) {
  const pathname = usePathname();
  const t = useTranslation();
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");
  const [openFooterMenus, setOpenFooterMenus] = useState<Record<FooterMenuId, boolean>>({
    navigation: false,
    contact: false,
    socials: false,
  });

  if (pathname.startsWith("/private-control-room-hub")) {
    return null;
  }

  const featuredCategories = vendorCategories.slice(0, 5);
  const currentYear = new Date().getFullYear();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail || subscribing) {
      return;
    }

    setSubscribing(true);
    setSubscribeError("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, website: "" }),
      });

      if (!response.ok) {
        throw new Error("Newsletter signup failed.");
      }

      setSubscribed(true);
      setEmail("");
    } catch {
      setSubscribeError(t("footer.newsletter.errorMessage"));
    } finally {
      setSubscribing(false);
    }
  };

  const toggleFooterMenu = (menu: FooterMenuId) => {
    setOpenFooterMenus((current) => ({
      ...current,
      [menu]: !current[menu],
    }));
  };

  const footerClassName = `wm-site-footer${pathname === "/" ? " wm-site-footer--home" : ""}`;

  return (
    <footer className={footerClassName}>
      <div className="container">

        {/* ── Main grid ── */}
        <div className="wm-site-footer__main">

          {/* Left — newsletter */}
          <div className="wm-site-footer__newsletter">
            <p className="wm-site-footer__newsletter-eyebrow">
              {t("footer.newsletter.eyebrow")}
            </p>
            <h2 className="wm-site-footer__newsletter-heading">
              {t("footer.newsletter.heading")}
            </h2>

            {subscribed ? (
              <p className="wm-site-footer__newsletter-success">
                {t("footer.newsletter.successMessage")}
              </p>
            ) : (
              <form className="wm-site-footer__newsletter-form" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  className="wm-site-footer__newsletter-input"
                  placeholder={t("footer.newsletter.placeholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={subscribing}
                  required
                  aria-label={t("footer.newsletter.placeholder")}
                />
                <button type="submit" className="wm-site-footer__newsletter-btn" disabled={subscribing}>
                  {subscribing ? t("footer.newsletter.submitting") : t("footer.newsletter.submit")}
                </button>
              </form>
            )}
            {subscribeError ? (
              <p className="wm-site-footer__newsletter-error" role="alert">
                {subscribeError}
              </p>
            ) : null}

            <div className="wm-site-footer__app-btns">
              <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" className="wm-site-footer__app-btn" aria-label="Download on the App Store">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                <span>
                  <span className="wm-site-footer__app-store-label">{language === "es" ? "Disponible en" : "Available on"}</span>
                  <span className="wm-site-footer__app-store-name">App Store</span>
                </span>
              </a>
              <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" className="wm-site-footer__app-btn" aria-label="Get it on Google Play">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="m3.18 23.76 10.97-10.97L3.18.23A2 2 0 0 0 2 2v19.99a2 2 0 0 0 1.18 1.77zM16.97 9.84 5.42 3.18l9.32 9.32 2.23-2.66zm3.06 1.85-2.4-1.37-2.47 2.96 2.47 2.96 2.4-1.37A2 2 0 0 0 21 12.69a2 2 0 0 0-.97-.99l-.001-.001zM5.42 20.82l11.55-6.66-2.23-2.66-9.32 9.32z" />
                </svg>
                <span>
                  <span className="wm-site-footer__app-store-label">{language === "es" ? "Disponible en" : "Get it on"}</span>
                  <span className="wm-site-footer__app-store-name">Google Play</span>
                </span>
              </a>
            </div>
          </div>

          {/* Right — columns */}
          <div className="wm-site-footer__cols">

            {/* Navigation */}
            <div className={`wm-site-footer__col${openFooterMenus.navigation ? " is-open" : ""}`}>
              <button
                type="button"
                className="wm-site-footer__col-heading"
                aria-expanded={openFooterMenus.navigation}
                aria-controls="footer-navigation-menu"
                onClick={() => toggleFooterMenu("navigation")}
              >
                <span>{t("footer.sections.navigation")}</span>
                <span className="wm-site-footer__col-caret" aria-hidden="true" />
              </button>
              <nav className="wm-site-footer__col-links" id="footer-navigation-menu">
                <Link href="/about">{t("nav.about")}</Link>
                <Link href="/vendors">{t("nav.vendors")}</Link>
                <Link href="/blog">{t("nav.blog")}</Link>
                <Link href="/shortlist">{t("nav.shortlist")}</Link>
                <Link href="/signup">{t("nav.signUp")}</Link>
                <Link href="/signup/vendor">{t("footer.vendorLinks.join")}</Link>
                {featuredCategories.map((cat) => (
                  <Link key={cat.key} href={`/vendors?category=${encodeURIComponent(cat.key)}`}>
                    {cat.label[language]}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Contact */}
            <div className={`wm-site-footer__col${openFooterMenus.contact ? " is-open" : ""}`}>
              <button
                type="button"
                className="wm-site-footer__col-heading"
                aria-expanded={openFooterMenus.contact}
                aria-controls="footer-contact-menu"
                onClick={() => toggleFooterMenu("contact")}
              >
                <span>{t("footer.sections.contact")}</span>
                <span className="wm-site-footer__col-caret" aria-hidden="true" />
              </button>
              <address className="wm-site-footer__col-links wm-site-footer__contact" id="footer-contact-menu">
                <a href={`mailto:${t("footer.contact.email")}`}>
                  {t("footer.contact.email")}
                </a>
                <a href={`tel:${t("footer.contact.phone").replace(/\D/g, "")}`}>
                  {t("footer.contact.phone")}
                </a>
                <span>{t("footer.contact.location")}</span>
              </address>
            </div>

            {/* Socials */}
            <div className={`wm-site-footer__col${openFooterMenus.socials ? " is-open" : ""}`}>
              <button
                type="button"
                className="wm-site-footer__col-heading"
                aria-expanded={openFooterMenus.socials}
                aria-controls="footer-socials-menu"
                onClick={() => toggleFooterMenu("socials")}
              >
                <span>{t("footer.sections.socials")}</span>
                <span className="wm-site-footer__col-caret" aria-hidden="true" />
              </button>
              <div className="wm-site-footer__socials" id="footer-socials-menu">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="wm-site-footer__social-link" aria-label="Instagram">
                  <IconInstagram />
                  <span>Instagram</span>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="wm-site-footer__social-link" aria-label="Facebook">
                  <IconFacebook />
                  <span>Facebook</span>
                </a>
                <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="wm-site-footer__social-link" aria-label="Pinterest">
                  <IconPinterest />
                  <span>Pinterest</span>
                </a>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="wm-site-footer__social-link" aria-label="X (Twitter)">
                  <IconX />
                  <span>X</span>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="wm-site-footer__social-link" aria-label="LinkedIn">
                  <IconLinkedIn />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* ── Watermark ── */}
        <div className="wm-site-footer__watermark" aria-hidden="true">
          Wedding Market
        </div>

        {/* ── Bottom bar ── */}
        <div className="wm-site-footer__bottom">
          <p className="mb-0">
            {t("footer.copyrightPrefix")} {currentYear} Wedding Market.{" "}
            {language === "es" ? "Todos los derechos reservados." : "All rights reserved."}
          </p>
          <div className="wm-site-footer__legal-links">
            <Link href="/terms">{t("footer.legal.terms")}</Link>
            <Link href="/privacy">{t("footer.legal.privacy")}</Link>
            <Link href="/account-deletion">{language === "es" ? "Eliminar cuenta" : "Account deletion"}</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLanguage, useTranslation } from "@/contexts/LanguageContext";
import type { HeaderVendorCategory } from "@/components/VendorsMegaMenu";
import { usesWorkspaceFooter } from "@/lib/header-navigation";
import WorkspaceFooter from "./WorkspaceFooter";
import { publisher } from "@/features/legal/identity";

type SiteFooterProps = {
  vendorCategories: HeaderVendorCategory[];
};

type FooterMenuId = "navigation" | "contact";

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
  });

  if (pathname.startsWith("/private-control-room-hub")) {
    return null;
  }
  if (usesWorkspaceFooter(pathname)) {
    return <WorkspaceFooter />;
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
                <a href={`mailto:${publisher.email}`}>
                  {publisher.email}
                </a>
                <span>{publisher.name} · {language === "es" ? "Florida, Estados Unidos" : publisher.jurisdiction}</span>
              </address>
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
            <Link href="/support">{language === "es" ? "Soporte" : "Support"}</Link>
            <Link href="/community-guidelines">{language === "es" ? "Comunidad" : "Community"}</Link>
            <Link href="/cookies">Cookies</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

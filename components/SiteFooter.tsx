"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import HeaderIcon from "@/components/HeaderIcon";
import { useLanguage, useTranslation } from "@/contexts/LanguageContext";
import type { HeaderVendorCategory } from "@/components/VendorsMegaMenu";
import { usesWorkspaceFooter } from "@/lib/header-navigation";
import WorkspaceFooter from "./WorkspaceFooter";
import { publisher } from "@/features/legal/identity";

type SiteFooterProps = { vendorCategories: HeaderVendorCategory[] };

function FooterMenu({ title, headingId, className, children }: {
  title: string;
  headingId: string;
  className: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  return <nav className={`wm-footer__menu ${className}`} aria-label={title} data-open={open}>
    <h3 id={headingId} className="wm-footer__menu-heading wm-footer__eyebrow">
      <span className="wm-footer__menu-title">{title}</span>
      <button className="wm-footer__menu-toggle" type="button" aria-expanded={open} aria-controls={contentId} onClick={() => setOpen((value) => !value)}>
        {title}<HeaderIcon name="chevron" aria-hidden="true" />
      </button>
    </h3>
    <div id={contentId} className="wm-footer__menu-content">{children}</div>
  </nav>;
}

export default function SiteFooter({ vendorCategories }: SiteFooterProps) {
  const pathname = usePathname();
  const t = useTranslation();
  const { language } = useLanguage();
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");
  const es = language === "es";

  if (pathname.startsWith("/private-control-room-hub")) return null;
  if (usesWorkspaceFooter(pathname)) return <WorkspaceFooter />;

  async function handleSubscribe(event: React.FormEvent) {
    event.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail || subscribing) return;
    setSubscribing(true);
    setSubscribeError("");
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, website: "" }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error("Newsletter signup failed.");
      setSubscribed(true);
      setEmail("");
    } catch {
      setSubscribeError(t("footer.newsletter.errorMessage"));
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <footer className={`wm-footer${pathname === "/" ? " wm-footer--home" : ""}`}>
      <div className="wm-footer__inner">
        <div className="wm-footer__identity">
          <Link href="/" className="wm-footer__brand">Wedding Market</Link>
          <p>{es ? "Tu día. Cada detalle." : "Your day. Every detail."}</p>
        </div>
        <div className="wm-footer__main">
          <section className="wm-footer__newsletter" aria-labelledby="footer-newsletter-title">
            <p className="wm-footer__eyebrow">{es ? "Un poco de inspiración" : "A little inspiration"}</p>
            <h2 id="footer-newsletter-title">{es ? "Algo bonito en tu correo." : "Something lovely in your inbox."}</h2>
            <p className="wm-footer__description">{es ? "Ideas para tu boda y novedades de Wedding Market." : "Wedding ideas and the latest from Wedding Market."}</p>
            {subscribed ? (
              <p className="wm-footer__success" role="status">{t("footer.newsletter.successMessage")}</p>
            ) : (
              <form className="wm-footer__form" onSubmit={handleSubscribe} aria-busy={subscribing}>
                <label htmlFor={emailId}>{es ? "Correo electrónico" : "Email address"}</label>
                <div className="wm-footer__email-row">
                  <input id={emailId} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} disabled={subscribing} required aria-describedby={subscribeError ? `${emailId}-error` : undefined} />
                  <button type="submit" disabled={subscribing} aria-label={subscribing ? t("footer.newsletter.submitting") : (es ? "Unirme al boletín" : "Join the newsletter")}>
                    <span>{subscribing ? (es ? "Enviando…" : "Joining…") : (es ? "Unirme" : "Join")}</span><span aria-hidden="true">→</span>
                  </button>
                </div>
              </form>
            )}
            {subscribeError ? <p id={`${emailId}-error`} className="wm-footer__error" role="alert">{subscribeError}</p> : null}
            <Link href="/privacy" className="wm-footer__privacy">{es ? "Nuestra política de privacidad" : "Our privacy policy"}</Link>
          </section>
          <FooterMenu key={`${pathname}-explore`} title={es ? "Explora" : "Explore"} headingId="footer-explore-title" className="wm-footer__links">
            <Link href="/vendors">{t("nav.vendors")}</Link>
            <Link href="/about">{t("nav.about")}</Link>
            <Link href="/blog">{t("nav.blog")}</Link>
            <Link href="/shortlist">{t("nav.shortlist")}</Link>
            <Link href="/signup">{t("nav.signUp")}</Link>
          </FooterMenu>
          <FooterMenu key={`${pathname}-services`} title={es ? "Para tu boda" : "For your wedding"} headingId="footer-services-title" className="wm-footer__links">
            {vendorCategories.slice(0, 5).map((category) => (
              <Link key={category.key} href={`/vendors?category=${encodeURIComponent(category.key)}`}>{category.label[language]}</Link>
            ))}
          </FooterMenu>
          <FooterMenu key={`${pathname}-professionals`} title={es ? "Profesionales de bodas" : "Wedding professionals"} headingId="footer-professionals-title" className="wm-footer__professionals">
            <Link href="/for-vendors" className="wm-footer__vendor-link">{es ? "Descubre Wedding Market para tu negocio" : "Discover Wedding Market for your business"}<span aria-hidden="true">↗</span></Link>
            <Link href="/support" className="wm-footer__support">{es ? "¿Necesitas ayuda?" : "Need a hand?"}</Link>
            <a href={`mailto:${publisher.email}`} className="wm-footer__email">{publisher.email}</a>
          </FooterMenu>
        </div>
        <div className="wm-footer__bottom">
          <div className="wm-footer__publisher">
            <p>© {new Date().getFullYear()} Wedding Market. {es ? "Todos los derechos reservados." : "All rights reserved."}</p>
            <p>{publisher.name} · {es ? "Florida, Estados Unidos" : publisher.jurisdiction}</p>
          </div>
          <nav className="wm-footer__legal" aria-label={es ? "Información legal" : "Legal information"}>
            <Link href="/terms">{t("footer.legal.terms")}</Link>
            <Link href="/privacy">{t("footer.legal.privacy")}</Link>
            <Link href="/community-guidelines">{es ? "Comunidad" : "Community"}</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/account-deletion">{es ? "Eliminar cuenta" : "Account deletion"}</Link>
            <Link href="/support">{es ? "Soporte" : "Support"}</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

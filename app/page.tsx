"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ContextualSponsoredUnits from "@/components/ads/ContextualSponsoredUnits";
import HeroNavActions from "@/components/HeroNavActions";
import VendorsMegaMenu, { type HeaderVendorCategory } from "@/components/VendorsMegaMenu";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getDefaultHomepageContent,
  type HomepageContent,
} from "@/lib/content/siteContent";
import { resolveMediaUrl } from "@/lib/media-url";

const CATEGORY_IMAGES: Record<string, string> = {
  venues: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80",
  photography: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=80",
  catering: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80",
  beauty: "https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?auto=format&fit=crop&w=900&q=80",
  entertainment: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80",
  decor: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=900&q=80",
};

const TEMP_HERO_YOUTUBE_EMBED_URL =
  "https://www.youtube-nocookie.com/embed/JgzkqjnsIvM?autoplay=1&mute=1&controls=0&playsinline=1&loop=1&playlist=JgzkqjnsIvM&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0";

const HOME_REFERENCE_COPY = {
  en: {
    searchEyebrow: "Private planning access",
    searchTitle: "Start with the vendor list that matters.",
    searchDescription: "Search by name, style, or category and move straight into a curated directory.",
    queryLabel: "Vendor or service",
    queryPlaceholder: "Photographer, planner, venue...",
    categoryLabel: "Category",
    categoryPlaceholder: "All categories",
    searchSubmit: "Explore vendors",
    stats: [
      { value: "01", label: "Vendor discovery" },
      { value: "02", label: "Shortlist and compare" },
      { value: "03", label: "Request quotes" },
    ],
    benefitsEyebrow: "Why it feels different",
    categoriesEyebrow: "Curated categories",
    processEyebrow: "Member-style workflow",
    processSteps: [
      "Build a shortlist around your date, style, and budget.",
      "Send one request to the vendors you want to compare.",
      "Track replies, quotes, and favorites from your account.",
    ],
    finalEyebrow: "Ready when you are",
  },
  es: {
    searchEyebrow: "Acceso privado de planeacion",
    searchTitle: "Empieza con la lista de proveedores que importa.",
    searchDescription: "Busca por nombre, estilo o categoria y entra directo a un directorio curado.",
    queryLabel: "Proveedor o servicio",
    queryPlaceholder: "Fotografo, planner, lugar...",
    categoryLabel: "Categoria",
    categoryPlaceholder: "Todas las categorias",
    searchSubmit: "Explorar proveedores",
    stats: [
      { value: "01", label: "Descubrir proveedores" },
      { value: "02", label: "Guardar y comparar" },
      { value: "03", label: "Pedir cotizaciones" },
    ],
    benefitsEyebrow: "Por que se siente diferente",
    categoriesEyebrow: "Categorias curadas",
    processEyebrow: "Flujo tipo membresia",
    processSteps: [
      "Crea una lista segun tu fecha, estilo y presupuesto.",
      "Envia una solicitud a los proveedores que quieres comparar.",
      "Sigue respuestas, cotizaciones y favoritos desde tu cuenta.",
    ],
    finalEyebrow: "Listo cuando ustedes lo esten",
  },
} as const;

const PLATFORM_FEATURES = [
  {
    id: "discover",
    titleEn: "Discover vendors",
    titleEs: "Descubre proveedores",
    descriptionEn: "Browse hundreds of curated wedding professionals by category, style, and budget.",
    descriptionEs: "Explora cientos de profesionales de bodas por categoría, estilo y presupuesto.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "quotes",
    titleEn: "Request quotes",
    titleEs: "Solicita cotizaciones",
    descriptionEn: "Send a single request to multiple vendors and receive personalised quotes in one place.",
    descriptionEs: "Envía una solicitud a varios proveedores y recibe cotizaciones en un solo lugar.",
    image: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "shortlist",
    titleEn: "Shortlist & compare",
    titleEs: "Guarda y compara",
    descriptionEn: "Save your favourites, share with your partner, and compare pricing side by side.",
    descriptionEs: "Guarda tus favoritos, compártelos con tu pareja y compara precios lado a lado.",
    image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "plan",
    titleEn: "Plan with confidence",
    titleEs: "Planifica con confianza",
    descriptionEn: "Manage vendor conversations, quotes, and timelines from one clean dashboard.",
    descriptionEs: "Gestiona conversaciones, cotizaciones y tiempos desde un solo panel.",
    image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
  },
];

const EDITORIAL_COPY = {
  en: {
    eyebrow: "For couples · by design",
    headingLine1: "The marketplace built",
    headingLine2: "for your perfect day.",
    tagline: "A curated platform that connects you with the best wedding professionals — organised, reviewed, and ready to book.",
  },
  es: {
    eyebrow: "Para parejas · por diseño",
    headingLine1: "El marketplace creado",
    headingLine2: "para tu día perfecto.",
    tagline: "Una plataforma curada que te conecta con los mejores profesionales de bodas — organizados, verificados y listos para reservar.",
  },
} as const;

const PROCESS_PANEL_IMAGES = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1600&q=80",
];

const PROCESS_PANEL_COPY = {
  en: [
    {
      tab: "Shortlist",
      title: "Build your",
      italic: "shortlist",
      summary: "Start with the vendors who fit your date, budget, style, and priorities.",
      highlights: ["Save favorites in one place", "Compare options without losing context", "Keep your partner aligned"],
    },
    {
      tab: "Request",
      title: "Send one",
      italic: "request",
      summary: "Share the essentials once and reach the vendors you want to compare.",
      highlights: ["Include date, category, and budget", "Route details to selected vendors", "Avoid repeating the same brief"],
    },
    {
      tab: "Track",
      title: "Track every",
      italic: "reply",
      summary: "Keep quotes, messages, and next steps organized from your account.",
      highlights: ["See conversations in one dashboard", "Review quotes side by side", "Move from inquiry to decision faster"],
    },
  ],
  es: [
    {
      tab: "Guardar",
      title: "Crea tu",
      italic: "lista",
      summary: "Empieza con proveedores que encajan con tu fecha, presupuesto, estilo y prioridades.",
      highlights: ["Guarda favoritos en un solo lugar", "Compara opciones sin perder contexto", "Mantén a tu pareja alineada"],
    },
    {
      tab: "Solicitar",
      title: "Envía una",
      italic: "solicitud",
      summary: "Comparte lo esencial una vez y llega a los proveedores que quieres comparar.",
      highlights: ["Incluye fecha, categoría y presupuesto", "Envía detalles a proveedores seleccionados", "Evita repetir el mismo brief"],
    },
    {
      tab: "Seguir",
      title: "Sigue cada",
      italic: "respuesta",
      summary: "Mantén cotizaciones, mensajes y próximos pasos organizados desde tu cuenta.",
      highlights: ["Ve conversaciones en un solo panel", "Revisa cotizaciones lado a lado", "Pasa de consulta a decisión más rápido"],
    },
  ],
} as const;

type VendorLogoItem = {
  id: string;
  label: string;
  imageUrl?: string | null;
};

function getVendorLogoInitials(label: string) {
  const words = label
    .replace(/\d+/g, "")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
  return initials || label.slice(0, 2).toUpperCase();
}

function shouldRenderLogoAsText(imageUrl: string | null | undefined) {
  return !imageUrl || imageUrl.includes("api.dicebear.com");
}

export default function Home() {
  const { dictionary, language } = useLanguage();
  const fallbackContent = useMemo(() => getDefaultHomepageContent(language), [language]);
  const [managedContent, setManagedContent] = useState<{
    language: string;
    value: HomepageContent;
  } | null>(null);
  const [vendorLogos, setVendorLogos] = useState<VendorLogoItem[]>([]);
  const [isHeroNavScrolled, setIsHeroNavScrolled] = useState(false);
  const [isHeroNavOpen, setIsHeroNavOpen] = useState(false);
  const [activeProcessIndex, setActiveProcessIndex] = useState(0);

  useEffect(() => {
    const updateHeroNavState = () => {
      setIsHeroNavScrolled(window.scrollY > 24);
    };

    updateHeroNavState();
    window.addEventListener("scroll", updateHeroNavState, { passive: true });

    return () => window.removeEventListener("scroll", updateHeroNavState);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 992px)");
    const syncNavMode = (event: MediaQueryList | MediaQueryListEvent) => {
      if (event.matches) {
        setIsHeroNavOpen(false);
      }
    };

    syncNavMode(mediaQuery);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncNavMode);
      return () => mediaQuery.removeEventListener("change", syncNavMode);
    }

    mediaQuery.addListener(syncNavMode);
    return () => mediaQuery.removeListener(syncNavMode);
  }, []);

  useEffect(() => {
    async function loadVendorLogos() {
      try {
        const res = await fetch("/api/vendors?pageSize=14", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          items: Array<{
            id: string;
            business_name: string;
            logo_url?: string | null;
            logo_image?: { url?: string } | null;
            thumbnail_image?: { url?: string } | null;
          }>;
        };
        const logos: VendorLogoItem[] = data.items.map((v) => ({
          id: v.id,
          label: v.business_name,
          imageUrl: v.logo_url ?? v.logo_image?.url ?? null,
        }));
        if (logos.length > 0) setVendorLogos(logos);
      } catch {
        // Keep empty – slider will be hidden
      }
    }
    void loadVendorLogos();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadManagedContent() {
      try {
        const response = await fetch(`/api/content/site-settings?lang=${encodeURIComponent(language)}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { homepage?: HomepageContent };
        if (!cancelled && payload.homepage) {
          setManagedContent({ language, value: payload.homepage });
        }
      } catch {
        if (!cancelled) {
          setManagedContent(null);
        }
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
  const referenceCopy = HOME_REFERENCE_COPY[language];
  const editorialCopy = EDITORIAL_COPY[language];
  const processPanels = PROCESS_PANEL_COPY[language];
  const activeProcessPanel = processPanels[activeProcessIndex] ?? processPanels[0];
  const homeVendorCategories = useMemo<HeaderVendorCategory[]>(
    () =>
      categories.items.map((category) => ({
        key: category.slug,
        label: {
          en: category.label,
          es: category.label,
        },
      })),
    [categories.items],
  );
  const homeAdKeywords = useMemo(
    () => categories.items.flatMap((item) => [item.slug, item.label]),
    [categories.items],
  );

  return (
    <main className="wm-site-page wm-home-premium">
      {/*
        The nav is intentionally rendered OUTSIDE the wm-founders-hero section.
        The hero uses `isolation: isolate` (needed for its video/overlay stacking),
        which would scope the nav's z-index inside that stacking context and allow
        later sections in the DOM to paint on top of it. Rendering the nav as a
        direct child of <main> (which creates no stacking context) means its
        `position: fixed; z-index: 2147483000` operates in the root stacking context
        and always appears above all page content.
      */}
      <nav
        className={`wm-founders-hero__nav${isHeroNavScrolled ? " wm-founders-hero__nav--scrolled" : ""}${isHeroNavOpen ? " is-open" : ""}`}
        aria-label="Primary navigation"
      >
        <button
          type="button"
          className="wm-founders-hero__mobile-toggle"
          aria-controls="wmHeroNavLinks"
          aria-expanded={isHeroNavOpen}
          aria-label="Toggle navigation"
          onClick={() => setIsHeroNavOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>
        <ul
          id="wmHeroNavLinks"
          className={`wm-founders-hero__nav-links${isHeroNavOpen ? " is-open" : ""}`}
        >
          <VendorsMegaMenu
            categories={homeVendorCategories}
            closeMobileNav={() => setIsHeroNavOpen(false)}
          />
          <li className="nav-item">
            <Link href="/about" className="nav-link" onClick={() => setIsHeroNavOpen(false)}>
              {dictionary.nav.about}
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/blog" className="nav-link" onClick={() => setIsHeroNavOpen(false)}>
              {dictionary.nav.blog}
            </Link>
          </li>
        </ul>
        <Link href="/" className="wm-founders-hero__brand">
          <span>{dictionary.nav.brand}</span>
        </Link>
        <HeroNavActions />
      </nav>

      <section className="wm-founders-hero" aria-labelledby="wm-founders-hero-title">
        <iframe
          className="wm-founders-hero__video"
          src={TEMP_HERO_YOUTUBE_EMBED_URL}
          title="Muted wedding hero background video"
          allow="autoplay; encrypted-media"
          aria-hidden="true"
          tabIndex={-1}
        />

        <div className="wm-founders-hero__content">
          <h1 id="wm-founders-hero-title">
            {hero.title
              ? hero.title
              : (
                <>
                  Where love
                  <em>meets perfection</em>
                </>
              )}
          </h1>
          <p>{hero.description ?? "Discover the finest wedding vendors — curated, trusted, and ready to make your day unforgettable."}</p>
          <Link href={hero.primaryCtaHref ?? "/vendors"} className="wm-founders-hero__cta">
            <span>{hero.primaryCtaLabel ?? "Explore Vendors"}</span>
            <span className="wm-founders-hero__cta-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M5 12h13" />
                <path d="m13 7 5 5-5 5" />
              </svg>
            </span>
          </Link>
        </div>

        {vendorLogos.length > 0 && (
          <div className="wm-founders-hero__logo-slider" aria-label="Featured wedding vendors">
            <div className="wm-founders-hero__logo-track">
              {[...vendorLogos, ...vendorLogos].map((logo, index) => (
                <span
                  key={`${logo.id}-${index}`}
                  className="wm-founders-hero__logo wm-founders-hero__logo--vendor"
                  aria-hidden={index >= vendorLogos.length}
                >
                  {shouldRenderLogoAsText(logo.imageUrl) ? (
                    <span className="wm-founders-hero__vendor-initials" aria-label={logo.label}>
                      {getVendorLogoInitials(logo.label)}
                    </span>
                  ) : logo.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveMediaUrl(logo.imageUrl)}
                      alt={logo.label}
                      className="wm-founders-hero__vendor-img"
                    />
                  ) : (
                    null
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        <a
          href="#about"
          className="wm-founders-hero__scroll-cue"
          aria-label="Scroll to next section"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </a>
      </section>

      <section className="container wm-home-premium-sponsored" id="about">
        <ContextualSponsoredUnits
          pageKey="home"
          headline={hero.title}
          keywords={homeAdKeywords}
        />
      </section>

      <section className="wm-editorial-section" id="benefits">
        <div className="container">

          {/* Two-column editorial header */}
          <div className="wm-editorial-section__header">
            <div className="wm-editorial-section__heading-col">
              <p className="wm-editorial-section__eyebrow">{editorialCopy.eyebrow}</p>
              <h2 className="wm-editorial-section__heading">
                {editorialCopy.headingLine1}
                <br />
                <em>{editorialCopy.headingLine2}</em>
              </h2>
            </div>
            <div className="wm-editorial-section__tagline-col">
              <p className="wm-editorial-section__tagline">{editorialCopy.tagline}</p>
            </div>
          </div>

          {/* Four feature cards */}
          <div className="wm-editorial-section__cards">
            {PLATFORM_FEATURES.map((feature) => (
              <article key={feature.id} className="wm-editorial-card">
                <div
                  className="wm-editorial-card__image"
                  style={{ backgroundImage: `url(${feature.image})` }}
                  aria-hidden="true"
                />
                <div className="wm-editorial-card__body">
                  <h3 className="wm-editorial-card__title">
                    {language === "es" ? feature.titleEs : feature.titleEn}
                  </h3>
                  <p className="wm-editorial-card__text">
                    {language === "es" ? feature.descriptionEs : feature.descriptionEn}
                  </p>
                </div>
              </article>
            ))}
          </div>

        </div>
      </section>

      <section className="wm-home-premium-categories" id="partnerships">
        <div className="container">
          <div className="wm-home-premium-section-head wm-home-premium-section-head--split">
            <div>
              <p className="wm-home-premium-eyebrow">{referenceCopy.categoriesEyebrow}</p>
              <h2>{categories.heading}</h2>
              <p>{categories.description}</p>
            </div>
            <Link href="/vendors" className="wm-home-premium-text-link">
              {categories.viewAll}
            </Link>
          </div>

          <div className="wm-home-premium-category-grid">
            {categories.items.map((category, index) => (
              <Link
                key={category.slug}
                href={`/vendors?category=${encodeURIComponent(category.slug)}`}
                className={`wm-home-premium-category ${index === 0 ? "wm-home-premium-category--featured" : ""}`}
              >
                <span className="wm-home-premium-category__image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={CATEGORY_IMAGES[category.slug] ?? CATEGORY_IMAGES.venues} alt={category.label} />
                </span>
                <span className="wm-home-premium-category__copy">
                  {index === 0 ? <span>{categories.spotlightLabel}</span> : null}
                  <h3>{category.label}</h3>
                  <strong>{categories.seeVendors}</strong>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="wm-home-premium-process" id="community">
        <div className="container">
          <div
            className="wm-home-premium-process__panel"
            style={{ backgroundImage: `url(${PROCESS_PANEL_IMAGES[activeProcessIndex] ?? PROCESS_PANEL_IMAGES[0]})` }}
          >
            <div className="wm-home-premium-process__tabs" aria-label={referenceCopy.processEyebrow}>
              {processPanels.map((panel, index) => (
                <button
                  key={panel.tab}
                  type="button"
                  className={`wm-home-premium-process__tab${index === activeProcessIndex ? " is-active" : ""}`}
                  onClick={() => setActiveProcessIndex(index)}
                  onFocus={() => setActiveProcessIndex(index)}
                  onMouseEnter={() => setActiveProcessIndex(index)}
                  aria-pressed={index === activeProcessIndex}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {panel.tab}
                </button>
              ))}
            </div>

            <div className="wm-home-premium-process__content">
              <div className="wm-home-premium-process__headline">
                <p className="wm-home-premium-eyebrow">{referenceCopy.processEyebrow}</p>
                <h2>
                  {activeProcessPanel.title}
                  <em>{activeProcessPanel.italic}</em>
                </h2>
              </div>

              <div className="wm-home-premium-process__details">
              <p className="wm-home-premium-eyebrow">{referenceCopy.processEyebrow}</p>
                <h3>{plan.heading}</h3>
                <p>{activeProcessPanel.summary}</p>
                <ol className="wm-home-premium-process__steps">
                  {activeProcessPanel.highlights.map((highlight, index) => (
                    <li key={highlight}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <p>{highlight}</p>
                    </li>
                  ))}
                </ol>
              <Link href={plan.ctaHref} className="wm-home-premium-button wm-home-premium-button--primary">
                {plan.ctaLabel}
              </Link>
            </div>
            </div>
          </div>
        </div>
      </section>

      <section className="wm-home-premium-final">
        <div className="container">
          <div className="wm-home-premium-final__inner">
            <p className="wm-home-premium-eyebrow">{referenceCopy.finalEyebrow}</p>
            <h2>{plan.heading}</h2>
            <Link href={hero.primaryCtaHref} className="wm-home-premium-button wm-home-premium-button--light">
              {hero.primaryCtaLabel}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

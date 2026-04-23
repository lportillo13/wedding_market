"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  VENDOR_ADS_PUBLICLY_VISIBLE,
  resolveVendorAdsCopy,
  tokenizeAdText,
  type SponsoredVendorAd,
} from "@/lib/content/vendorAds";
import { resolveMediaUrl, shouldRenderUnoptimizedMedia } from "@/lib/media-url";

type ContextualAdsPageKey = "home" | "blog" | "blog-post" | "shortlist" | "rfq" | "vendor-profile";

type ContextualSponsoredUnitsProps = {
  pageKey: ContextualAdsPageKey;
  headline?: string | null;
  searchQuery?: string | null;
  category?: string | null;
  keywords?: string[];
  themes?: string[];
  countries?: string[];
  budget?: number | null;
  guestCount?: number | null;
  excludeVendorId?: string | null;
  className?: string;
};

type ContextualAdsResponse = {
  sponsoredVendors?: SponsoredVendorAd[];
  error?: string;
};

type DisplayLabels = {
  kicker: string;
  relatedSponsors: string;
  browseMore: string;
  scoreLabel: string;
  sectionTitle: string;
  sectionDescription: string;
};

function normalizeList(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value))
        .map((value) => value.toLowerCase()),
    ),
  );
}

function truncateText(value: string, limit: number): string {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit - 3)}...`;
}

function formatBudget(value: number, language: "en" | "es") {
  return new Intl.NumberFormat(language === "es" ? "es-MX" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildDisplayLabels(
  language: "en" | "es",
  pageKey: ContextualAdsPageKey,
  context: {
    headline: string;
    searchQuery: string;
    category: string;
    themes: string[];
    countries: string[];
    budget: number | null;
    guestCount: number | null;
  },
): DisplayLabels {
  if (language === "es") {
    if (context.searchQuery) {
      return {
        kicker: "Patrocinado segun tu contexto",
        relatedSponsors: "Mas patrocinadores relacionados",
        browseMore: "Explorar mas proveedores",
        scoreLabel: "Calificacion",
        sectionTitle: `Coincidencias patrocinadas para "${context.searchQuery}"`,
        sectionDescription:
          "Estas posiciones pagadas se ordenan con la busqueda actual, tus preferencias guardadas y la ultima solicitud que llenaste.",
      };
    }

    if (pageKey === "rfq") {
      return {
        kicker: "Patrocinado segun tu contexto",
        relatedSponsors: "Proveedores relacionados",
        browseMore: "Ver mas opciones",
        scoreLabel: "Calificacion",
        sectionTitle: "Recomendaciones patrocinadas para esta solicitud",
        sectionDescription:
          "Mientras completas la cotizacion, mostramos proveedores que encajan mejor con el tema, pais, presupuesto y capacidad que has indicado.",
      };
    }

    if (pageKey === "shortlist") {
      return {
        kicker: "Patrocinado segun tu contexto",
        relatedSponsors: "Complementa tu shortlist",
        browseMore: "Ir al directorio",
        scoreLabel: "Calificacion",
        sectionTitle: "Patrocinadores que complementan tus favoritos",
        sectionDescription:
          "Estas recomendaciones aprovechan los proveedores que ya guardaste para sugerir opciones pagadas del mismo estilo o categoria.",
      };
    }

    if (pageKey === "blog" || pageKey === "blog-post") {
      return {
        kicker: "Patrocinado segun tu contexto",
        relatedSponsors: "Proveedores relacionados",
        browseMore: "Explorar proveedores",
        scoreLabel: "Calificacion",
        sectionTitle: context.headline
          ? `Proveedores patrocinados relacionados con ${context.headline}`
          : "Proveedores patrocinados relacionados con lo que estas leyendo",
        sectionDescription:
          "El contenido del blog tambien alimenta la recomendacion para mostrar socios patrocinados alineados con la idea, estilo o categoria del articulo.",
      };
    }

    if (pageKey === "vendor-profile") {
      return {
        kicker: "Patrocinado segun tu contexto",
        relatedSponsors: "Mas opciones relacionadas",
        browseMore: "Volver al directorio",
        scoreLabel: "Calificacion",
        sectionTitle: "Patrocinadores relacionados con este perfil",
        sectionDescription:
          "Usamos la categoria del proveedor actual junto con tus preferencias guardadas para mostrar alternativas patrocinadas mas relevantes.",
      };
    }

    return {
      kicker: "Patrocinado segun tu contexto",
      relatedSponsors: "Proveedores destacados",
      browseMore: "Explorar proveedores",
      scoreLabel: "Calificacion",
      sectionTitle: "Patrocinadores relacionados con tu planeacion",
      sectionDescription:
        "Estas recomendaciones combinan la intencion de la pagina actual con las preferencias guardadas de la boda para que los anuncios se sientan mas utiles.",
    };
  }

  if (context.searchQuery) {
    return {
      kicker: "Sponsored by your context",
      relatedSponsors: "More related sponsors",
      browseMore: "Browse more vendors",
      scoreLabel: "Rating",
      sectionTitle: `Sponsored matches for "${context.searchQuery}"`,
      sectionDescription:
        "These paid placements are ranked from the current search, your saved preferences, and the latest request form you filled out.",
    };
  }

  if (pageKey === "rfq") {
    return {
      kicker: "Sponsored by your context",
      relatedSponsors: "Related sponsors",
      browseMore: "See more vendors",
      scoreLabel: "Rating",
      sectionTitle: "Sponsored recommendations for this request",
      sectionDescription:
        "As you complete the quote request, vendors are matched against the theme, country, budget, and guest count you have entered.",
    };
  }

  if (pageKey === "shortlist") {
    return {
      kicker: "Sponsored by your context",
      relatedSponsors: "Round out your shortlist",
      browseMore: "Go to directory",
      scoreLabel: "Rating",
      sectionTitle: "Sponsored vendors that complement your shortlist",
      sectionDescription:
        "These recommendations use the vendors you already saved to surface paid placements with nearby categories or similar planning intent.",
    };
  }

  if (pageKey === "blog" || pageKey === "blog-post") {
    return {
      kicker: "Sponsored by your context",
      relatedSponsors: "Related sponsors",
      browseMore: "Explore vendors",
      scoreLabel: "Rating",
      sectionTitle: context.headline
        ? `Sponsored vendors related to ${context.headline}`
        : "Sponsored vendors related to what you're reading",
      sectionDescription:
        "Blog content also feeds the recommendation layer so sponsored partners can align with the idea, style, or category behind the article.",
    };
  }

  if (pageKey === "vendor-profile") {
    return {
      kicker: "Sponsored by your context",
      relatedSponsors: "More related options",
      browseMore: "Back to directory",
      scoreLabel: "Rating",
      sectionTitle: "Sponsored vendors related to this profile",
      sectionDescription:
        "The current vendor category and your saved preferences are combined to surface more relevant paid alternatives.",
    };
  }

  return {
    kicker: "Sponsored by your context",
    relatedSponsors: "Featured sponsors",
    browseMore: "Explore vendors",
    scoreLabel: "Rating",
    sectionTitle: "Sponsored vendors aligned with your planning journey",
    sectionDescription:
      "These recommendations combine the current page context with your saved wedding preferences so ads feel more useful than generic placements.",
  };
}

export default function ContextualSponsoredUnits({
  pageKey,
  headline,
  searchQuery,
  category,
  keywords = [],
  themes = [],
  countries = [],
  budget = null,
  guestCount = null,
  excludeVendorId = null,
  className,
}: ContextualSponsoredUnitsProps) {
  const { language } = useLanguage();
  const [sponsoredVendors, setSponsoredVendors] = useState<SponsoredVendorAd[]>([]);

  const requestContext = useMemo(
    () => ({
      searchQuery: searchQuery?.trim() ?? "",
      category: category?.trim() ?? "",
      keywords: normalizeList([...keywords, ...tokenizeAdText(headline)]),
      themes: normalizeList(themes),
      countries: normalizeList(countries),
      budget,
      guestCount,
      excludeVendorId,
    }),
    [budget, category, countries, excludeVendorId, guestCount, headline, keywords, searchQuery, themes],
  );
  const deferredContext = useDeferredValue(requestContext);

  useEffect(() => {
    if (!VENDOR_ADS_PUBLICLY_VISIBLE) {
      return;
    }

    const controller = new AbortController();

    async function loadContextualAds() {
      try {
        const response = await fetch("/api/ads/contextual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ context: deferredContext }),
          signal: controller.signal,
        });

        if (!response.ok) {
          setSponsoredVendors([]);
          return;
        }

        const payload = (await response.json()) as ContextualAdsResponse;
        if (!controller.signal.aborted) {
          setSponsoredVendors(payload.sponsoredVendors ?? []);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSponsoredVendors([]);
        }
      }
    }

    void loadContextualAds();

    return () => controller.abort();
  }, [deferredContext]);

  const primarySponsor = sponsoredVendors[0] ?? null;
  const secondarySponsors = sponsoredVendors.slice(1, 3);

  const labels = useMemo(
    () =>
      buildDisplayLabels(language, pageKey, {
        headline: headline?.trim() ?? "",
        searchQuery: requestContext.searchQuery,
        category: requestContext.category,
        themes: requestContext.themes,
        countries: requestContext.countries,
        budget: requestContext.budget,
        guestCount: requestContext.guestCount,
      }),
    [
      headline,
      language,
      pageKey,
      requestContext.budget,
      requestContext.category,
      requestContext.countries,
      requestContext.guestCount,
      requestContext.searchQuery,
      requestContext.themes,
    ],
  );

  const insightChips = useMemo(() => {
    const chips: string[] = [];

    if (requestContext.category) {
      chips.push(requestContext.category);
    }
    if (requestContext.themes[0]) {
      chips.push(requestContext.themes[0]);
    }
    if (requestContext.countries[0]) {
      chips.push(requestContext.countries[0]);
    }
    if (typeof requestContext.guestCount === "number") {
      chips.push(
        language === "es" ? `${requestContext.guestCount} invitados` : `${requestContext.guestCount} guests`,
      );
    }
    if (typeof requestContext.budget === "number") {
      chips.push(formatBudget(requestContext.budget, language));
    }

    return chips.slice(0, 4);
  }, [language, requestContext.budget, requestContext.category, requestContext.countries, requestContext.guestCount, requestContext.themes]);

  if (!VENDOR_ADS_PUBLICLY_VISIBLE || !primarySponsor) {
    return null;
  }

  const primaryBadge = resolveVendorAdsCopy(primarySponsor.placement.badge, language);
  const primaryNote = resolveVendorAdsCopy(primarySponsor.placement.note, language);
  const primaryCta = resolveVendorAdsCopy(primarySponsor.placement.ctaLabel, language);
  const primarySummary =
    language === "es"
      ? primarySponsor.vendor.bioEs || primarySponsor.vendor.bioEn
      : primarySponsor.vendor.bioEn || primarySponsor.vendor.bioEs;
  const sectionClassName = ["wm-contextual-sponsored", className].filter(Boolean).join(" ");

  return (
    <section className={sectionClassName}>
      <div className="wm-contextual-sponsored__layout">
        <article className="wm-contextual-sponsored__hero">
          <div className="wm-contextual-sponsored__copy">
            <span className="wm-sponsored-banner__badge">{labels.kicker}</span>
            <h2 className="wm-contextual-sponsored__title">{labels.sectionTitle}</h2>
            <p className="wm-contextual-sponsored__description">{labels.sectionDescription}</p>

            {insightChips.length > 0 ? (
              <div className="wm-contextual-sponsored__chips" aria-label={labels.kicker}>
                {insightChips.map((chip) => (
                  <span key={chip} className="wm-contextual-sponsored__chip">
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="wm-contextual-sponsored__actions">
              <Link className="btn btn-light" href={`/vendors/${primarySponsor.vendor.slug}`}>
                {primaryCta}
              </Link>
              <Link className="btn btn-outline-light" href="/vendors">
                {labels.browseMore}
              </Link>
            </div>
          </div>

          <div className="wm-contextual-sponsored__feature-card">
            <div className="wm-contextual-sponsored__feature-media">
              {primarySponsor.vendor.thumbnailUrl ? (
                <Image
                  src={resolveMediaUrl(primarySponsor.vendor.thumbnailUrl)}
                  alt={primarySponsor.vendor.businessName}
                  fill
                  className="object-fit-cover"
                  unoptimized={shouldRenderUnoptimizedMedia(primarySponsor.vendor.thumbnailUrl)}
                  sizes="(max-width: 991px) 100vw, 28vw"
                />
              ) : (
                <div className="wm-contextual-sponsored__placeholder">
                  {primarySponsor.vendor.businessName.slice(0, 1)}
                </div>
              )}
            </div>

            <div className="wm-contextual-sponsored__feature-body">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <span className="wm-sponsored-card__badge">{primaryBadge}</span>
                <span className="small text-secondary">
                  {labels.scoreLabel} {primarySponsor.vendor.ratingAvg.toFixed(1)} ({primarySponsor.vendor.ratingCount})
                </span>
              </div>
              <h3 className="h4 mb-0">{primarySponsor.vendor.businessName}</h3>
              {primarySponsor.vendor.categories.length > 0 ? (
                <p className="mb-0 small text-secondary">{primarySponsor.vendor.categories.join(", ")}</p>
              ) : null}
              <p className="mb-0">{primaryNote}</p>
              {primarySummary ? <p className="mb-0 text-secondary">{truncateText(primarySummary, 150)}</p> : null}
            </div>
          </div>
        </article>

        <aside className="wm-contextual-sponsored__sidebar">
          <div className="wm-contextual-sponsored__sidebar-header">
            <span className="wm-admin-kicker mb-1">{labels.relatedSponsors}</span>
          </div>

          <div className="wm-contextual-sponsored__rail">
            {secondarySponsors.length > 0 ? (
              secondarySponsors.map(({ placement, vendor }) => {
                const badge = resolveVendorAdsCopy(placement.badge, language);
                const note = resolveVendorAdsCopy(placement.note, language);

                return (
                  <Link
                    key={placement.id}
                    href={`/vendors/${vendor.slug}`}
                    className="wm-contextual-sponsored__rail-card"
                  >
                    <div className="wm-contextual-sponsored__rail-copy">
                      <span className="wm-sponsored-inline-badge">{badge}</span>
                      <h3>{vendor.businessName}</h3>
                      {vendor.categories.length > 0 ? (
                        <p className="mb-0 small text-secondary">{vendor.categories.join(", ")}</p>
                      ) : null}
                      <p className="mb-0 text-secondary">{truncateText(note, 90)}</p>
                    </div>
                    <span className="wm-contextual-sponsored__rail-arrow" aria-hidden="true">
                      &rarr;
                    </span>
                  </Link>
                );
              })
            ) : (
              <div className="wm-contextual-sponsored__rail-empty">
                <p className="mb-0 text-secondary">{labels.sectionDescription}</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

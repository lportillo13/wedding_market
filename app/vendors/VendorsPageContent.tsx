"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import SponsoredVendorsSection from "@/components/ads/SponsoredVendorsSection";
import VendorAdsBanner from "@/components/ads/VendorAdsBanner";
import ShortlistButton from "@/components/shortlist/ShortlistButton";
import AutocompleteInput from "@/components/search/AutocompleteInput";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  VENDOR_ADS_PUBLICLY_VISIBLE,
  resolveVendorAdsCopy,
  type SponsoredVendorAd,
  type VendorAdsConfig,
} from "@/lib/content/vendorAds";
import { resolveMediaUrl, shouldRenderUnoptimizedMedia } from "@/lib/media-url";
import type { CategoryOption, VendorListItem } from "./types";
import ExampleVendorNotice from "@/components/vendor/ExampleVendorNotice";
import { exampleVendorCopy } from "@/shared/vendors/examples";

type VendorsPageContentProps = {
  error?: boolean;
  items: VendorListItem[];
  isVendor: boolean;
  page: number;
  totalPages: number;
  searchParams: Record<string, string>;
  adsConfig: VendorAdsConfig;
  sponsoredVendors: SponsoredVendorAd[];
  categories: CategoryOption[];
};

function buildPageHref(searchParams: Record<string, string>, page: number) {
  const params = new URLSearchParams({ ...searchParams, page: String(page) });
  if (page <= 1) {
    params.delete("page");
  }
  const query = params.toString();
  return query ? `/vendors?${query}` : "/vendors";
}

function getVendorInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || name.slice(0, 2).toUpperCase();
}

export default function VendorsPageContent({
  error,
  items,
  isVendor,
  page,
  totalPages,
  searchParams,
  adsConfig,
  sponsoredVendors,
  categories,
}: VendorsPageContentProps) {
  const { dictionary, language } = useLanguage();
  const labels = dictionary.vendorsPage;
  const isExample = searchParams.examples === '1';
  const exampleLabels = exampleVendorCopy[language === 'es' ? 'es' : 'en'];
  const resetHref = isExample ? '/vendors?examples=1' : '/vendors';
  const categoryOptions = useMemo(() => {
    const sourceCategories =
      categories.length > 0
        ? categories
        : dictionary.home.categories.items.map((item) => ({
            key: item.slug,
            label: { en: item.label, es: item.label },
          }));

    return sourceCategories
      .map((category) => {
        const localizedLabel =
          category.label && typeof category.label === "object"
            ? language === "es"
              ? category.label.es ?? category.label.en
              : category.label.en ?? category.label.es
            : null;

        return {
          key: category.key,
          label: typeof localizedLabel === "string" && localizedLabel.trim() ? localizedLabel : category.key,
        };
      })
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [categories, dictionary.home.categories.items, language]);
  const categoryLabelsByKey = useMemo(
    () => new Map(categoryOptions.map((item) => [item.key.toLowerCase(), item.label])),
    [categoryOptions],
  );
  const selectedCategory = useMemo(() => {
    const requestedCategory = searchParams.category?.trim().toLowerCase();
    if (!requestedCategory) {
      return "";
    }

    return (
      categoryOptions.find(
        (item) =>
          item.key.toLowerCase() === requestedCategory ||
          item.label.trim().toLowerCase() === requestedCategory,
      )?.key ?? ""
    );
  }, [categoryOptions, searchParams.category]);

  const pageLabel = useMemo(
    () => labels.pagination.pageLabel.replace("{current}", String(page)).replace("{total}", String(Math.max(1, totalPages))),
    [labels.pagination.pageLabel, page, totalPages],
  );
  const vendorSuggestions = useMemo(() => items.map((item) => item.business_name), [items]);
  const visibleSponsoredVendors = useMemo(
    () => (VENDOR_ADS_PUBLICLY_VISIBLE ? sponsoredVendors : []),
    [sponsoredVendors],
  );
  const sponsoredBadgeByVendorId = useMemo(
    () =>
      new Map(
        visibleSponsoredVendors.map((entry) => [entry.vendor.id, resolveVendorAdsCopy(entry.placement.badge, language)]),
      ),
    [language, visibleSponsoredVendors],
  );

  return (
    <main className="wm-vendors-shell">
      {/* ── Hero / Search ── */}
      <section className="wm-vendors-hero">
        <div className="container">
          <p className="wm-vendors-hero__eyebrow">{labels.eyebrow}</p>
          <h1 className="wm-vendors-hero__title">
            {isExample ? exampleLabels.title : labels.title}
          </h1>
          <p className="wm-vendors-hero__sub">{labels.description}</p>

          <form action="/vendors" method="get">
            {isExample && <input type="hidden" name="examples" value="1" />}
            <div className="wm-vendors-search">
              <div className="wm-vendors-search__field">
                <svg className="wm-vendors-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="wm-vendors-search__label">{language === 'es' ? 'Nombre o palabra clave' : 'Name or keyword'}</span>
                  <AutocompleteInput
                    className="wm-vendors-search__input"
                    name="q"
                    placeholder={labels.searchForm.queryPlaceholder}
                    defaultValue={searchParams.q || ""}
                    ariaLabel={labels.searchForm.queryPlaceholder}
                    suggestions={vendorSuggestions}
                    suggestionsEndpoint={isExample ? undefined : "/api/vendors/suggest"}
                  />
                </div>
              </div>
              <div className="wm-vendors-search__field">
                <svg className="wm-vendors-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="wm-vendors-search__label">{language === 'es' ? 'Tipo de servicio' : 'Service category'}</span>
                  <select
                    className="wm-vendors-search__input wm-vendors-search__select"
                    name="category"
                    aria-label={labels.searchForm.categoryPlaceholder}
                    defaultValue={selectedCategory}
                  >
                    <option value="">{labels.searchForm.categoryAllLabel}</option>
                    {categoryOptions.map((category) => (
                      <option key={category.key} value={category.key}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="wm-vendors-search__btn" type="submit">
                {labels.searchForm.submit}
              </button>
            </div>
          </form>
          {(searchParams.q || searchParams.category) && <Link className="wm-search-reset" href={resetHref}>{language === 'es' ? 'Limpiar búsqueda y filtros' : 'Clear search and filters'}</Link>}
        </div>
      </section>

      {/* ── Content ── */}
      <div className="wm-vendors-content">
        <div className="container">
          {isExample && <ExampleVendorNotice />}
          {VENDOR_ADS_PUBLICLY_VISIBLE && <><div style={{ marginBottom: "2rem" }}>
            <VendorAdsBanner banner={adsConfig.directoryBanner} language={language} variant="directory" />
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <SponsoredVendorsSection
              section={adsConfig.sponsoredSection}
              sponsoredVendors={visibleSponsoredVendors}
              isVendor={isVendor}
            />
          </div>

          </>}

          {error ? (
            <div role="alert" className="alert alert-warning">{language === "es" ? "No pudimos cargar los proveedores. Inténtalo de nuevo en unos minutos." : "We could not load vendors. Please try again shortly."}</div>
          ) : items.length === 0 ? (
            <div className="wm-vendors-empty">
              <h2>{language === 'es' ? 'Cada gran boda empieza con una conexión.' : 'Every great wedding starts with a connection.'}</h2>
              <p>{labels.empty}</p>
              {!isExample && <p><Link href="/vendors?examples=1" className="wm-example-entry">{exampleLabels.title} <span aria-hidden="true">↗</span></Link></p>}
              {(searchParams.q || searchParams.category) ? <Link href={resetHref} className="btn btn-outline-secondary">{language === 'es' ? 'Ver todos los servicios' : 'See all services'}</Link> : !isExample && <Link href="/signup/vendor" className="btn btn-outline-secondary">{language === 'es' ? '¿Ofreces servicios para bodas? Únete' : 'A wedding professional? Join us'}</Link>}
            </div>
          ) : (
            <div className="wm-vendor-grid">
              {items.map((vendor) => {
                const bio = language === "es" ? vendor.bio_es || vendor.bio_en || "" : vendor.bio_en || vendor.bio_es || "";
                const preview = bio.length > 130 ? `${bio.slice(0, 130)}...` : bio;
                const localizedCategories = (vendor.categories ?? []).map((category) => {
                  const key = category.trim().toLowerCase();
                  return categoryLabelsByKey.get(key) ?? category;
                });
                const sponsoredBadge = sponsoredBadgeByVendorId.get(vendor.id);
                const logoUrl = vendor.logo_image?.url ?? vendor.logo_url ?? null;

                return (
                  <article className="wm-vendor-card" key={vendor.id}>
                    {vendor.thumbnail_image?.url ? (
                      <div className="wm-vendor-card__media">
                        <Image
                          src={resolveMediaUrl(vendor.thumbnail_image.url)}
                          alt={`${vendor.business_name} thumbnail`}
                          fill
                          unoptimized={shouldRenderUnoptimizedMedia(vendor.thumbnail_image.url)}
                          sizes="(max-width: 768px) 100vw, 360px"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    ) : null}
                    <div className="wm-vendor-card__body">
                      {vendor.is_example && <span className="wm-vendor-card__cats">{exampleLabels.badge}</span>}
                      {sponsoredBadge ? (
                        <span className="wm-vendor-card__badge">{sponsoredBadge}</span>
                      ) : null}
                      <div className="wm-vendor-card__heading">
                        <a href={`/vendors/${vendor.slug}`} className="wm-vendor-card__name">
                          {vendor.business_name}
                        </a>
                        <span className="wm-vendor-card__logo" aria-hidden="true">
                          {logoUrl ? (
                            <Image
                              src={resolveMediaUrl(logoUrl)}
                              alt=""
                              fill
                              unoptimized={shouldRenderUnoptimizedMedia(logoUrl)}
                              sizes="44px"
                              style={{ objectFit: "contain" }}
                            />
                          ) : (
                            <span>{getVendorInitials(vendor.business_name)}</span>
                          )}
                        </span>
                      </div>
                      {localizedCategories.length > 0 ? (
                        <div className="wm-vendor-card__cats">{localizedCategories.join(" · ")}</div>
                      ) : null}
                      {bio ? <p className="wm-vendor-card__bio">{preview}</p> : <div style={{ flex: 1 }} />}
                      <div className="wm-vendor-card__footer">
                        <div className="wm-vendor-card__rating">
                          <span className="wm-vendor-card__star">★</span>
                          <strong>{Number(vendor.rating_avg || 0).toFixed(1)}</strong>
                          <span>({vendor.rating_count || 0})</span>
                        </div>
                        {!isVendor && !vendor.is_example ? (
                          <div style={{ position: "relative", zIndex: 1 }}>
                            <ShortlistButton vendorId={vendor.id} />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {totalPages > 1 && <nav className="wm-vendors-pagination" aria-label={language === 'es' ? 'Páginas de resultados' : 'Results pages'}>
            <a
              className={`wm-vendors-pagination__btn${page <= 1 ? " wm-vendors-pagination__btn--disabled" : ""}`}
              href={buildPageHref(searchParams, Math.max(1, page - 1))}
              aria-disabled={page <= 1}
            >
              ← {labels.pagination.prev}
            </a>
            <span className="wm-vendors-pagination__count">{pageLabel}</span>
            <a
              className={`wm-vendors-pagination__btn${page >= totalPages ? " wm-vendors-pagination__btn--disabled" : ""}`}
              href={buildPageHref(searchParams, Math.min(totalPages, page + 1))}
              aria-disabled={page >= totalPages}
            >
              {labels.pagination.next} →
            </a>
          </nav>}
        </div>
      </div>
    </main>
  );
}

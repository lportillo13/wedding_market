"use client";

import Image from "next/image";
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

type VendorsPageContentProps = {
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

export default function VendorsPageContent({
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
          <p className="wm-vendors-hero__eyebrow">Curated directory</p>
          <h1 className="wm-vendors-hero__title">
            {labels.title}
          </h1>
          <p className="wm-vendors-hero__sub">
            Discover top-rated wedding professionals — browse by name, style, or category.
          </p>

          <form action="/vendors" method="get">
            <div className="wm-vendors-search">
              <div className="wm-vendors-search__field">
                <svg className="wm-vendors-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="wm-vendors-search__label">{labels.searchForm.queryPlaceholder.split(" ")[0]}</span>
                  <AutocompleteInput
                    className="wm-vendors-search__input"
                    name="q"
                    placeholder={labels.searchForm.queryPlaceholder}
                    defaultValue={searchParams.q || ""}
                    ariaLabel={labels.searchForm.queryPlaceholder}
                    suggestions={vendorSuggestions}
                    suggestionsEndpoint="/api/vendors/suggest"
                  />
                </div>
              </div>
              <div className="wm-vendors-search__field">
                <svg className="wm-vendors-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="wm-vendors-search__label">{labels.searchForm.categoryPlaceholder.split(" ")[0]}</span>
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
        </div>
      </section>

      {/* ── Content ── */}
      <div className="wm-vendors-content">
        <div className="container">
          <div style={{ marginBottom: "2rem" }}>
            <VendorAdsBanner banner={adsConfig.directoryBanner} language={language} variant="directory" />
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <SponsoredVendorsSection
              section={adsConfig.sponsoredSection}
              sponsoredVendors={visibleSponsoredVendors}
              isVendor={isVendor}
            />
          </div>

          {items.length === 0 ? (
            <div className="wm-vendors-empty">
              <p>{labels.empty}</p>
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
                      {sponsoredBadge ? (
                        <span className="wm-vendor-card__badge">{sponsoredBadge}</span>
                      ) : null}
                      <a href={`/vendors/${vendor.slug}`} className="wm-vendor-card__name">
                        {vendor.business_name}
                      </a>
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
                        {!isVendor ? (
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

          <nav className="wm-vendors-pagination" aria-label="Page navigation">
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
          </nav>
        </div>
      </div>
    </main>
  );
}

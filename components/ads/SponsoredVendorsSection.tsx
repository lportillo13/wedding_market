"use client";

import Image from "next/image";
import Link from "next/link";
import ShortlistButton from "@/components/shortlist/ShortlistButton";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  VENDOR_ADS_PUBLICLY_VISIBLE,
  resolveVendorAdsCopy,
  type SponsoredVendorAd,
  type VendorAdsConfig,
} from "@/lib/content/vendorAds";
import { resolveMediaUrl, shouldRenderUnoptimizedMedia } from "@/lib/media-url";

type SponsoredVendorsSectionProps = {
  section: VendorAdsConfig["sponsoredSection"];
  sponsoredVendors: SponsoredVendorAd[];
  isVendor: boolean;
};

function truncateText(value: string, limit: number) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit - 3)}...`;
}

export default function SponsoredVendorsSection({
  section,
  sponsoredVendors,
  isVendor,
}: SponsoredVendorsSectionProps) {
  const { dictionary, language } = useLanguage();
  const categoryLabelsByKey = new Map(
    dictionary.home.categories.items.map((item) => [item.slug.toLowerCase(), item.label])
  );

  if (!VENDOR_ADS_PUBLICLY_VISIBLE || !section.enabled || sponsoredVendors.length === 0) {
    return null;
  }

  const title = resolveVendorAdsCopy(section.title, language);
  const description = resolveVendorAdsCopy(section.description, language);

  return (
    <section className="wm-sponsored-section">
      <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-3">
        <div>
          <p className="wm-admin-kicker mb-1">Sponsored</p>
          <h2 className="h3 mb-1">{title}</h2>
        </div>
        <p className="mb-0 text-secondary wm-sponsored-section__intro">{description}</p>
      </div>

      <div className="wm-sponsored-grid">
        {sponsoredVendors.map(({ placement, vendor }) => {
          const badge = resolveVendorAdsCopy(placement.badge, language);
          const note = resolveVendorAdsCopy(placement.note, language);
          const ctaLabel = resolveVendorAdsCopy(placement.ctaLabel, language);
          const summary = language === "es" ? vendor.bioEs || vendor.bioEn : vendor.bioEn || vendor.bioEs;
          const preview = truncateText(summary, 150);
          const categories = vendor.categories.map((category) => {
            const normalized = category.trim().toLowerCase();
            return categoryLabelsByKey.get(normalized) ?? category;
          });

          return (
            <article key={placement.id} className="wm-sponsored-card">
              <div className="wm-sponsored-card__media">
                {vendor.thumbnailUrl ? (
                  <Image
                    src={resolveMediaUrl(vendor.thumbnailUrl)}
                    alt={`${vendor.businessName} thumbnail`}
                    fill
                    unoptimized={shouldRenderUnoptimizedMedia(vendor.thumbnailUrl)}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-fit-cover"
                  />
                ) : (
                  <div className="wm-sponsored-card__placeholder">
                    <span>{vendor.businessName.slice(0, 1)}</span>
                  </div>
                )}
              </div>

              <div className="wm-sponsored-card__body">
                <div className="d-flex align-items-center justify-content-between gap-3">
                  <span className="wm-sponsored-card__badge">{badge}</span>
                  <span className="small text-secondary">
                    Rating {vendor.ratingAvg.toFixed(1)} ({vendor.ratingCount})
                  </span>
                </div>

                <div className="d-grid gap-2">
                  <h3 className="wm-card-title mb-0">{vendor.businessName}</h3>
                  {categories.length > 0 ? (
                    <div className="small text-secondary">{categories.join(", ")}</div>
                  ) : null}
                </div>

                <p className="mb-0 text-secondary">{note}</p>
                {preview ? <p className="mb-0">{preview}</p> : null}

                <div className="d-flex align-items-center justify-content-between gap-2 mt-auto">
                  <Link className="btn btn-primary btn-sm" href={`/vendors/${vendor.slug}`}>
                    {ctaLabel}
                  </Link>
                  {!isVendor ? (
                    <div className="position-relative" style={{ zIndex: 1 }}>
                      <ShortlistButton vendorId={vendor.id} />
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { resolveMediaUrl, shouldRenderUnoptimizedMedia } from "@/lib/media-url";
import ShortlistButton from "@/components/shortlist/ShortlistButton";
import { Stars } from "@/components/Stars";
import { useLanguage } from "@/contexts/LanguageContext";
import ShareVendorMenu from "./ShareVendorMenu";
import type { VendorProfileDTO } from "@/types/vendor-profile";

type VendorHeaderProps = {
  vendor: VendorProfileDTO["vendor"];
  media: VendorProfileDTO["media"];
  isVendor: boolean;
  isLoggedIn: boolean;
  loginHref: string;
};

function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function isPhoto(url: string) {
  return !url.endsWith(".mp4") && !url.includes("/video/");
}

export default function VendorHeader({ vendor, media, isVendor, isLoggedIn, loginHref }: VendorHeaderProps) {
  const { dictionary, language } = useLanguage();
  const labels = dictionary.vendorPublic.header;

  const formatCurrency = (value: number | null | undefined, currency: string): string | null => {
    if (!value || Number.isNaN(value)) return null;
    try {
      return new Intl.NumberFormat(language === "es" ? "es-ES" : "en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(value / 100);
    } catch {
      return `$${(value / 100).toFixed(0)}`;
    }
  };

  const startingPrice = formatCurrency(vendor.startingPriceCents, vendor.startingPriceCurrency);
  const typicalSpend = formatCurrency(vendor.typicalSpendCents, vendor.typicalSpendCurrency);
  const locationParts = [vendor.location.city, vendor.location.region, vendor.location.country]
    .filter(Boolean)
    .join(", ");
  const heroPhoto = media.find((item) => item.type === "photo" && isPhoto(item.url)) ?? null;

  return (
    <header className="wm-vendor-hero">
      <div className="wm-vendor-hero__frame">
        {heroPhoto ? (
          <div className="wm-vendor-hero__spotlight">
            <Image
              src={resolveMediaUrl(heroPhoto.url)}
              alt={heroPhoto.caption || vendor.name}
              fill
              unoptimized={shouldRenderUnoptimizedMedia(heroPhoto.url)}
              className="object-fit-cover"
              sizes="100vw"
              priority
            />
          </div>
        ) : (
          <div className="wm-vendor-hero__spotlight wm-vendor-hero__spotlight--empty" />
        )}

        <div className="wm-vendor-hero__card">
          <div className="wm-vendor-hero__identity">
            {vendor.logoUrl ? (
              <div className="wm-vendor-hero__logo">
                <Image
                  src={resolveMediaUrl(vendor.logoUrl)}
                  alt={fill(labels.logoAlt, { vendor: vendor.name })}
                  width={152}
                  height={152}
                  unoptimized={shouldRenderUnoptimizedMedia(vendor.logoUrl)}
                />
              </div>
            ) : (
              <div className="wm-vendor-hero__logo wm-vendor-hero__logo--placeholder">
                <span>{vendor.name.slice(0, 1)}</span>
              </div>
            )}

            <div className="wm-vendor-hero__copy">
              <p className="wm-admin-kicker mb-2">Featured vendor</p>
              <h1 className="wm-vendor-hero__name mb-2">{vendor.name}</h1>
              {vendor.summary ? <p className="wm-vendor-hero__summary mb-0">{vendor.summary}</p> : null}
            </div>
          </div>

          <div className="wm-vendor-hero__meta">
            {locationParts ? <span className="wm-vendor-chip">{locationParts}</span> : null}
            {vendor.eventTypes.length ? <span className="wm-vendor-chip">{vendor.eventTypes.join(" • ")}</span> : null}
            {vendor.yearsInBusiness ? (
              <span className="wm-vendor-chip">{fill(labels.yearsInBusiness, { years: vendor.yearsInBusiness })}</span>
            ) : null}
            {vendor.languages.length ? (
              <span className="wm-vendor-chip">{fill(labels.languages, { languages: vendor.languages.join(", ") })}</span>
            ) : null}
          </div>

          <div className="wm-vendor-hero__details">
            <div className="wm-vendor-hero__rating">
              {vendor.ratingAvg ? (
                <>
                  <Stars value={vendor.ratingAvg} />
                  <strong>{vendor.ratingAvg.toFixed(1)}</strong>
                  <span className="text-muted">{fill(labels.reviewsCount, { count: vendor.ratingCount })}</span>
                </>
              ) : (
                <span className="text-muted">{labels.noReviews}</span>
              )}
            </div>

            <div className="wm-vendor-hero__pricing">
              {isLoggedIn ? (
                <>
                  {startingPrice ? <div>{fill(labels.startingPrice, { price: startingPrice })}</div> : null}
                  {typicalSpend ? <div>{fill(labels.typicalSpend, { price: typicalSpend })}</div> : null}
                </>
              ) : (
                <div>{labels.loginToViewPricing}</div>
              )}
            </div>
          </div>

          <div className="wm-vendor-hero__actions">
            {isVendor ? (
              <Link href="/vendor/inbox" className="btn btn-primary btn-lg">
                {labels.viewReceivedRequests}
              </Link>
            ) : isLoggedIn ? (
              <>
                <a href="#contact" className="btn btn-primary btn-lg">
                  {labels.requestQuote}
                </a>
                <ShortlistButton vendorId={vendor.id} sizeClassName="btn-lg" />
              </>
            ) : (
              <>
                <Link href={loginHref} className="btn btn-primary btn-lg">
                  {labels.logInToRequestQuote}
                </Link>
                <ShortlistButton vendorId={vendor.id} sizeClassName="btn-lg" />
              </>
            )}
            <ShareVendorMenu vendorName={vendor.name} />
          </div>
        </div>
      </div>
    </header>
  );
}

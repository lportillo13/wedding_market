"use client";

import Image from "next/image";
import Link from "next/link";
import { resolveMediaUrl, shouldRenderUnoptimizedMedia } from "@/lib/media-url";
import ShortlistButton from "@/components/shortlist/ShortlistButton";
import { Stars } from "@/components/Stars";
import { useLanguage } from "@/contexts/LanguageContext";
import ShareVendorMenu from "./ShareVendorMenu";
import type { VendorProfileDTO } from "@/types/vendor-profile";
import { exampleVendorCopy } from "@/shared/vendors/examples";

type VendorHeaderProps = {
  vendor: VendorProfileDTO["vendor"];
  media: VendorProfileDTO["media"];
  categories: VendorProfileDTO["breadcrumbs"]["categories"];
  isVendor: boolean;
  isLoggedIn: boolean;
  loginHref: string;
  isExample?: boolean;
};

function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export default function VendorHeader({
  vendor,
  media,
  categories,
  isVendor,
  isLoggedIn,
  loginHref,
  isExample = false,
}: VendorHeaderProps) {
  const { dictionary, language } = useLanguage();
  const exampleLabels = exampleVendorCopy[language === 'es' ? 'es' : 'en'];
  const labels = dictionary.vendorPublic.header;
  const editorial = dictionary.vendorPublic.editorial;
  const photos = media.filter(
    (item) =>
      item.type === "photo" &&
      !item.url.toLowerCase().endsWith(".mp4") &&
      !item.url.includes("/video/"),
  );
  const hero = photos[0];
  const supporting = photos.slice(1, 3);
  const location = [
    vendor.location.city,
    vendor.location.region,
    vendor.location.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <header className="container wm-profile-hero">
      <div className="wm-profile-hero__copy">
        <p className="wm-profile-eyebrow">{editorial.eyebrow}</p>
        {categories.length > 0 && (
          <p className="wm-profile-hero__category">
            {categories.map((category) => category.label).join(" · ")}
          </p>
        )}
        <h1>{vendor.name}</h1>
        {location && (
          <p className="wm-profile-hero__location">
            <span aria-hidden="true">⌖</span> {location}
          </p>
        )}
        <div className="wm-profile-hero__rating">
          {vendor.ratingAvg && vendor.ratingCount > 0 ? (
            <>
              <Stars value={vendor.ratingAvg} />
              <strong>{vendor.ratingAvg.toFixed(1)}</strong>
              <a href="#reviews">
                {fill(labels.reviewsCount, { count: vendor.ratingCount })}
              </a>
            </>
          ) : (
            <span>{labels.noReviews}</span>
          )}
        </div>
        {vendor.summary && (
          <p className="wm-profile-hero__summary">{vendor.summary}</p>
        )}
        <div className="wm-profile-hero__actions">
          <Link
            className="btn btn-primary"
            href={
              isVendor ? "/vendor/inbox" : isLoggedIn ? "#contact" : loginHref
            }
          >
            {isExample ? exampleLabels.form : isVendor ? labels.viewReceivedRequests : labels.requestQuote}
            <span aria-hidden="true">↗︎</span>
          </Link>
          {!isExample && <ShortlistButton vendorId={vendor.id} />}
          <ShareVendorMenu vendorName={vendor.name} />
        </div>
        {!isVendor && !isLoggedIn && (
          <p className="wm-profile-hero__hint">{editorial.signInHint}</p>
        )}
        {(vendor.yearsInBusiness ||
          vendor.languages.length > 0 ||
          vendor.eventTypes.length > 0) && (
          <div
            className="wm-profile-hero__facts"
            role="group"
            aria-label={editorial.atAGlance}
          >
            {vendor.yearsInBusiness ? (
              <span>
                {fill(labels.yearsInBusiness, {
                  years: vendor.yearsInBusiness,
                })}
              </span>
            ) : null}
            {vendor.languages.length > 0 && (
              <span>
                {fill(labels.languages, {
                  languages: vendor.languages.join(", "),
                })}
              </span>
            )}
            {vendor.eventTypes.length > 0 && (
              <span>{vendor.eventTypes.join(" · ")}</span>
            )}
          </div>
        )}
      </div>
      <div
        className={`wm-profile-hero__visual${hero ? "" : " wm-profile-hero__visual--empty"}`}
      >
        {hero ? (
          <>
            <a
              className="wm-profile-hero__cover"
              href="#photos"
              aria-label={editorial.viewGallery}
            >
              <Image
                src={resolveMediaUrl(hero.url)}
                alt={hero.caption || vendor.name}
                fill
                priority
                sizes="(max-width: 991px) 100vw, 55vw"
                unoptimized={shouldRenderUnoptimizedMedia(hero.url)}
              />
              <span className="wm-profile-hero__gallery-link">
                {editorial.viewGallery}
                <span aria-hidden="true">↗︎</span>
              </span>
            </a>
            {supporting.length > 0 && (
              <div className="wm-profile-hero__details" aria-hidden="true">
                {supporting.map((photo) => (
                  <div key={photo.id}>
                    <Image
                      src={resolveMediaUrl(photo.url)}
                      alt=""
                      fill
                      sizes="(max-width: 991px) 45vw, 25vw"
                      unoptimized={shouldRenderUnoptimizedMedia(photo.url)}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="wm-profile-hero__monogram" aria-hidden="true">
            {vendor.name.slice(0, 1)}
          </div>
        )}
        {!hero && <p>{editorial.noPhotos}</p>}
        {vendor.logoUrl && (
          <div className="wm-profile-hero__seal">
            <Image
              src={resolveMediaUrl(vendor.logoUrl)}
              alt={fill(labels.logoAlt, { vendor: vendor.name })}
              width={80}
              height={80}
              unoptimized={shouldRenderUnoptimizedMedia(vendor.logoUrl)}
            />
          </div>
        )}
        {hero && (
          <p className="wm-profile-hero__caption">
            <span aria-hidden="true">✧</span> {editorial.portfolio}
          </p>
        )}
      </div>
    </header>
  );
}

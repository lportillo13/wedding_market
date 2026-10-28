"use client";

import Image from "next/image";
import Link from "next/link";
import { resolveMediaUrl, shouldRenderUnoptimizedMedia } from "@/lib/media-url";
import ShortlistButton from "@/components/shortlist/ShortlistButton";
import { Stars } from "@/components/Stars";
import { useLanguage } from "@/contexts/LanguageContext";
import ShareVendorMenu from "./ShareVendorMenu";
import type { VendorProfileDTO } from "@/types/vendor-profile";
import type { VendorHeroVideo } from '@/shared/vendors/hero';
import VendorCoverVideo from './VendorCoverVideo';

type VendorHeaderProps = {
  vendor: VendorProfileDTO["vendor"];
  media: VendorProfileDTO["media"];
  categories: VendorProfileDTO["breadcrumbs"]["categories"];
  isVendor: boolean;
  isLoggedIn: boolean;
  loginHref: string;
  isExample?: boolean;
  heroVideo?: VendorHeroVideo | null;
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
  heroVideo = null,
}: VendorHeaderProps) {
  const { dictionary, language } = useLanguage();
  const labels = dictionary.vendorPublic.header;
  const editorial = dictionary.vendorPublic.editorial;
  const photos = media.filter(
    (item) =>
      item.type === "photo" &&
      !item.url.toLowerCase().endsWith(".mp4") &&
      !item.url.includes("/video/"),
  );
  const hero = photos[0];
  const location = [
    vendor.location.city,
    vendor.location.region,
    vendor.location.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <header className={`wm-profile-hero${heroVideo && heroVideo.provider !== 'file' ? ' wm-profile-hero--external-video' : ''}`}>
      <div className="wm-profile-hero__copy">
        {vendor.logoUrl && <div className="wm-profile-hero__seal">
          <Image src={resolveMediaUrl(vendor.logoUrl)} alt={fill(labels.logoAlt, { vendor: vendor.name })} width={56} height={56} unoptimized={shouldRenderUnoptimizedMedia(vendor.logoUrl)} />
        </div>}
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
        <div className="wm-profile-hero__actions">
          <Link
            className="btn btn-primary"
            href={
              isVendor ? "/vendor/inbox" : isLoggedIn ? "#contact" : loginHref
            }
          >
            {isExample ? labels.requestQuote : isVendor ? labels.viewReceivedRequests : labels.requestQuote}
            <span aria-hidden="true">→</span>
          </Link>
          {!isExample && <ShortlistButton vendorId={vendor.id} />}
          <ShareVendorMenu vendorName={vendor.name} />
        </div>
        {!isVendor && !isLoggedIn && (
          <p className="wm-profile-hero__hint">{editorial.signInHint}</p>
        )}
      </div>
      <div
        className={`wm-profile-hero__visual${hero || heroVideo ? "" : " wm-profile-hero__visual--empty"}`}
      >
        {hero || heroVideo ? (
          <>
            <div className="wm-profile-hero__cover">
              {heroVideo ? <VendorCoverVideo key={heroVideo.url} source={heroVideo} poster={hero?.url ?? null} name={vendor.name} language={language === 'es' ? 'es' : 'en'} /> : hero && <Image
                src={resolveMediaUrl(hero.url)}
                alt={hero.caption || vendor.name}
                fill
                priority
                sizes="100vw"
                unoptimized={shouldRenderUnoptimizedMedia(hero.url)}
              />}
            </div>
              <a className="wm-profile-hero__gallery-link" href="#photos">
                <span className="wm-profile-hero__gallery-label">{editorial.viewGallery}</span>
                <span className="wm-profile-hero__gallery-short">{dictionary.vendorPublic.tabs.photos}</span>
                <span aria-hidden="true">↗︎</span>
              </a>
          </>
        ) : (
          <div className="wm-profile-hero__monogram" aria-hidden="true">
            {vendor.name.slice(0, 1)}
          </div>
        )}
        {!hero && !heroVideo && <p>{editorial.noPhotos}</p>}
      </div>
    </header>
  );
}

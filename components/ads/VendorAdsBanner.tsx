"use client";

import Image from "next/image";
import Link from "next/link";
import type { SupportedLanguage } from "@/lib/i18n";
import {
  VENDOR_ADS_PUBLICLY_VISIBLE,
  resolveVendorAdsCopy,
  type VendorAdsBanner as VendorAdsBannerConfig,
} from "@/lib/content/vendorAds";
import { resolveMediaUrl, shouldRenderUnoptimizedMedia } from "@/lib/media-url";

type VendorAdsBannerProps = {
  banner: VendorAdsBannerConfig;
  language: SupportedLanguage;
  variant?: "directory" | "profile";
};

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

export default function VendorAdsBanner({
  banner,
  language,
  variant = "directory",
}: VendorAdsBannerProps) {
  if (!VENDOR_ADS_PUBLICLY_VISIBLE || !banner.enabled) {
    return null;
  }

  const badge = resolveVendorAdsCopy(banner.badge, language);
  const title = resolveVendorAdsCopy(banner.title, language);
  const description = resolveVendorAdsCopy(banner.description, language);
  const ctaLabel = resolveVendorAdsCopy(banner.ctaLabel, language);
  const imageAlt = resolveVendorAdsCopy(banner.imageAlt, language);
  const href = banner.ctaHref.trim();
  const imageUrl = banner.imageUrl.trim();

  return (
    <article className={`wm-sponsored-banner wm-sponsored-banner--${variant}`}>
      <div className="wm-sponsored-banner__copy">
        <span className="wm-sponsored-banner__badge">{badge}</span>
        <h2 className="wm-sponsored-banner__title">{title}</h2>
        <p className="mb-0 text-secondary">{description}</p>

        {href && ctaLabel ? (
          isExternalHref(href) ? (
            <a className="btn btn-light align-self-start" href={href} target="_blank" rel="noreferrer">
              {ctaLabel}
            </a>
          ) : (
            <Link className="btn btn-light align-self-start" href={href}>
              {ctaLabel}
            </Link>
          )
        ) : null}
      </div>

      <div className="wm-sponsored-banner__visual" aria-hidden={imageUrl ? undefined : true}>
        {imageUrl ? (
          <Image
            src={resolveMediaUrl(imageUrl)}
            alt={imageAlt}
            fill
            unoptimized={shouldRenderUnoptimizedMedia(imageUrl)}
            sizes={variant === "profile" ? "(max-width: 992px) 100vw, 28vw" : "(max-width: 992px) 100vw, 36vw"}
            className="object-fit-cover"
          />
        ) : (
          <div className="wm-sponsored-banner__placeholder">
            <span className="wm-sponsored-banner__orb wm-sponsored-banner__orb--large" />
            <span className="wm-sponsored-banner__orb wm-sponsored-banner__orb--medium" />
            <span className="wm-sponsored-banner__orb wm-sponsored-banner__orb--small" />
          </div>
        )}
      </div>
    </article>
  );
}

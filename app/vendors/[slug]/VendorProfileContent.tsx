"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import Link from "next/link";
import ShortlistButton from "@/components/shortlist/ShortlistButton";
import { Stars } from "@/components/Stars";
import { useLanguage } from "@/contexts/LanguageContext";
import { resolveMediaUrl, shouldRenderUnoptimizedMedia } from "@/lib/media-url";
import type { VendorImage } from "@/types/vendor";
import type { VendorProfile } from "./types";

type GalleryProps = {
  vendorName: string;
  images: VendorImage[];
};

function GalleryEditorial({ vendorName, images }: GalleryProps) {
  const lead = images[0] ?? null;
  const supporting = images.slice(1, 5);
  const strip = images.slice(5, 9);

  if (!lead) return null;

  return (
    <div className="wm-vendor-showcase">
      <article className="wm-vendor-showcase__lead">
        <div className="wm-vendor-showcase__media">
          <Image
            src={resolveMediaUrl(lead.url)}
            alt={`${vendorName} showcase`}
            fill
            unoptimized={shouldRenderUnoptimizedMedia(lead.url)}
            sizes="(max-width: 992px) 100vw, 62vw"
            className="object-fit-cover"
            priority
          />
        </div>
        <div className="wm-vendor-showcase__lead-copy">
          <p className="wm-admin-kicker mb-1">Featured frame</p>
          <h3 className="h4 mb-1">{vendorName}</h3>
          <p className="text-secondary mb-0">A first look at the atmosphere, styling, and details behind this vendor.</p>
        </div>
      </article>

      <div className="wm-vendor-showcase__rail">
        {supporting.map((image) => (
          <article className="wm-vendor-showcase__card" key={image.public_id}>
            <div className="wm-vendor-showcase__media">
              <Image
                src={resolveMediaUrl(image.url)}
                alt={`${vendorName} gallery image`}
                fill
                unoptimized={shouldRenderUnoptimizedMedia(image.url)}
                sizes="(max-width: 992px) 50vw, 20vw"
                className="object-fit-cover"
              />
            </div>
          </article>
        ))}
      </div>

      {strip.length > 0 ? (
        <div className="wm-vendor-showcase__strip">
          {strip.map((image) => (
            <article className="wm-vendor-showcase__mini" key={image.public_id}>
              <div className="wm-vendor-showcase__mini-media">
                <Image
                  src={resolveMediaUrl(image.url)}
                  alt={`${vendorName} detail image`}
                  fill
                  unoptimized={shouldRenderUnoptimizedMedia(image.url)}
                  sizes="(max-width: 992px) 50vw, 18vw"
                  className="object-fit-cover"
                />
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function isVideoAsset(asset: VendorImage) {
  return asset.type === "video" || asset.format.toLowerCase() === "mp4" || asset.url.toLowerCase().endsWith(".mp4");
}

function buildCaptionTrackSrc(text: string) {
  const vtt = `WEBVTT\n\n00:00.000 --> 00:10.000\n${text.replace(/\s+/g, " ").trim() || "Video"}`;
  return `data:text/vtt;charset=utf-8,${encodeURIComponent(vtt)}`;
}

type VendorProfileContentProps = {
  vendor: VendorProfile;
  averageRating: number;
  ratingCount: number;
  reviewRfqId: string | null;
  children: ReactNode;
};

export default function VendorProfileContent({
  vendor,
  averageRating,
  ratingCount,
  reviewRfqId,
  children,
}: VendorProfileContentProps) {
  const { dictionary, language } = useLanguage();
  const labels = dictionary.vendorProfile;

  const bio = language === "es" ? vendor.bio_es || vendor.bio_en : vendor.bio_en || vendor.bio_es;
  const extraInfo =
    language === "es"
      ? vendor.extra_info_es || vendor.extra_info_en
      : vendor.extra_info_en || vendor.extra_info_es;
  const galleryPhotos = (vendor.gallery_images ?? []).filter((asset) => !isVideoAsset(asset));
  const galleryVideos = (vendor.gallery_images ?? []).filter((asset) => isVideoAsset(asset));
  const galleryCount = galleryPhotos.length + galleryVideos.length;
  const categoryText = vendor.categories?.join(" • ") ?? "";

  return (
    <main className="container py-4 wm-vendor-profile">
      <section className="wm-vendor-stage">
        {vendor.hero_image?.url ? (
          <div className="wm-vendor-stage__hero">
            <Image
              src={resolveMediaUrl(vendor.hero_image.url)}
              alt={`${vendor.business_name} hero image`}
              width={vendor.hero_image.width}
              height={vendor.hero_image.height}
              unoptimized={shouldRenderUnoptimizedMedia(vendor.hero_image.url)}
              className="w-100 rounded-4"
              sizes="(max-width: 960px) 100vw, 960px"
              priority
            />
          </div>
        ) : (
          <div className="wm-vendor-stage__hero wm-vendor-stage__hero--empty" />
        )}

        <div className="wm-vendor-stage__panel">
          <div className="wm-vendor-stage__intro">
            {vendor.thumbnail_image?.url ? (
              <div className="wm-vendor-stage__thumb">
                <Image
                  src={resolveMediaUrl(vendor.thumbnail_image.url)}
                  alt={`${vendor.business_name} thumbnail`}
                  fill
                  unoptimized={shouldRenderUnoptimizedMedia(vendor.thumbnail_image.url)}
                  sizes="160px"
                  style={{ objectFit: "cover" }}
                />
              </div>
            ) : (
              <div className="wm-vendor-stage__thumb wm-vendor-stage__thumb--placeholder">
                <span>{vendor.business_name.slice(0, 1)}</span>
              </div>
            )}

            <div className="wm-vendor-stage__title">
              <p className="wm-admin-kicker mb-2">Vendor profile</p>
              <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2">
                <h1 className="wm-page-title mb-0">{vendor.business_name}</h1>
                <ShortlistButton vendorId={vendor.id} />
              </div>

              {categoryText ? <div className="wm-vendor-stage__categories">{categoryText}</div> : null}

              <div className="d-flex align-items-center gap-2 mt-3">
                <Stars value={averageRating} />
                <span className="text-muted">({ratingCount})</span>
              </div>
            </div>
          </div>

          <div className="wm-vendor-stage__stats">
            <div><strong>{galleryCount}</strong><span>media pieces</span></div>
            <div><strong>{vendor.categories?.length ?? 0}</strong><span>categories</span></div>
            <div><strong>{ratingCount}</strong><span>reviews</span></div>
          </div>

          {(bio || extraInfo) ? (
            <div className="wm-vendor-stage__story">
              {bio ? <p className="mb-0">{bio}</p> : null}
              {extraInfo ? <p className="text-secondary mb-0">{extraInfo}</p> : null}
            </div>
          ) : null}
        </div>
      </section>

      {reviewRfqId && (
        <div className="my-2">
          <Link className="btn btn-primary" href={`/account/reviews/new/${reviewRfqId}`}>
            {labels.writeReview}
          </Link>
        </div>
      )}

      {galleryPhotos.length > 0 ? (
        <section className="my-5">
          <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-3">
            <div>
              <p className="wm-admin-kicker mb-1">Visual story</p>
              <h2 className="h3 mb-0">{labels.galleryHeading}</h2>
            </div>
            <p className="text-muted mb-0">
              A curated look at {vendor.business_name} through uploaded moments, details, and atmosphere.
            </p>
          </div>
          <GalleryEditorial vendorName={vendor.business_name} images={galleryPhotos} />
        </section>
      ) : null}

      {galleryVideos.length > 0 ? (
        <section className="my-5">
          <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-3">
            <div>
              <p className="wm-admin-kicker mb-1">Motion</p>
              <h2 className="h3 mb-0">Videos</h2>
            </div>
            <p className="text-muted mb-0">Show walkthroughs, atmosphere, and live moments in motion.</p>
          </div>
          <div className="row g-4">
            {galleryVideos.map((video) => (
              <div className="col-12 col-lg-6" key={video.public_id}>
                <div className="ratio ratio-16x9 rounded-4 overflow-hidden bg-black shadow-sm">
                  <video controls className="w-100 h-100" preload="metadata">
                    <source src={resolveMediaUrl(video.url)} />
                    <track
                      kind="captions"
                      srcLang={language}
                      label="Captions"
                      src={buildCaptionTrackSrc(`${vendor.business_name} video`)}
                      default
                    />
                  </video>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {extraInfo && !bio ? (
        <section className="mt-2">
          <h2 className="h5">{labels.extraInfoHeading}</h2>
          <p className="mb-0 text-secondary" style={{ whiteSpace: "pre-wrap" }}>{extraInfo}</p>
        </section>
      ) : null}

      <hr className="my-4" />

      {children}

      <div className="alert alert-info mt-4">{labels.moreComing}</div>
    </main>
  );
}

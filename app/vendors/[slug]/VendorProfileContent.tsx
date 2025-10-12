"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import ShortlistButton from "@/components/shortlist/ShortlistButton";
import { Stars } from "@/components/Stars";
import { useLanguage } from "@/contexts/LanguageContext";
import type { VendorImage } from "@/types/vendor";
import type { VendorProfile } from "./types";

type GalleryProps = {
  vendorName: string;
  images: VendorImage[];
};

function GalleryCarousel({ vendorName, images }: GalleryProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollPrev(scrollLeft > 8);
    setCanScrollNext(scrollLeft + clientWidth < scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = containerRef.current;
    if (!el) return;

    const handler = () => updateScrollState();
    el.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler);
    return () => {
      el.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, [updateScrollState]);

  const scrollBy = useCallback((direction: 1 | -1) => {
    const el = containerRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.9, 240);
    el.scrollBy({ left: amount * direction, behavior: "smooth" });
  }, []);

  return (
    <div className="vendor-gallery-swiper">
      <div
        ref={containerRef}
        className="vendor-gallery-swiper__track"
        role="group"
        aria-label={`${vendorName} gallery images`}
      >
        {images.map((image) => {
          const aspectRatio = image.width && image.height ? `${image.width} / ${image.height}` : "4 / 3";
          return (
            <div className="vendor-gallery-swiper__slide" key={image.public_id}>
              <div className="vendor-gallery-swiper__figure" style={{ aspectRatio }}>
                <Image
                  src={image.url}
                  alt={`${vendorName} gallery image`}
                  fill
                  sizes="(max-width: 960px) 100vw, 480px"
                  className="vendor-gallery-swiper__image"
                  priority={false}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="vendor-gallery-swiper__controls" aria-hidden="true">
        <button
          type="button"
          className="vendor-gallery-swiper__control btn btn-light btn-sm"
          onClick={() => scrollBy(-1)}
          disabled={!canScrollPrev}
        >
          ‹
        </button>
        <button
          type="button"
          className="vendor-gallery-swiper__control btn btn-light btn-sm"
          onClick={() => scrollBy(1)}
          disabled={!canScrollNext}
        >
          ›
        </button>
      </div>
    </div>
  );
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

  return (
    <main className="container py-4" style={{ maxWidth: 960 }}>
      {vendor.hero_image?.url ? (
        <div className="mb-4">
          <Image
            src={vendor.hero_image.url}
            alt={`${vendor.business_name} hero image`}
            width={vendor.hero_image.width}
            height={vendor.hero_image.height}
            className="w-100 rounded"
            sizes="(max-width: 960px) 100vw, 960px"
            priority
          />
        </div>
      ) : null}

      <div className="d-flex flex-column flex-md-row align-items-start gap-3 mb-3">
        {vendor.thumbnail_image?.url ? (
          <div className="position-relative rounded overflow-hidden" style={{ width: 160, height: 160 }}>
            <Image
              src={vendor.thumbnail_image.url}
              alt={`${vendor.business_name} thumbnail`}
              fill
              sizes="160px"
              style={{ objectFit: "cover" }}
            />
          </div>
        ) : null}
        <div className="flex-grow-1 w-100">
          <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2">
            <h1 className="mb-0">{vendor.business_name}</h1>
            <ShortlistButton vendorId={vendor.id} />
          </div>

          {vendor.categories?.length ? (
            <div className="mb-2 small text-secondary">{vendor.categories.join(" • ")}</div>
          ) : null}

          <div className="d-flex align-items-center gap-2 my-3">
            <Stars value={averageRating} />
            <span className="text-muted">({ratingCount})</span>
          </div>
        </div>
      </div>

      {reviewRfqId && (
        <div className="my-3">
          <Link className="btn btn-primary" href={`/account/reviews/new/${reviewRfqId}`}>
            {labels.writeReview}
          </Link>
        </div>
      )}

      {bio ? <p className="lead">{bio}</p> : null}

      {vendor.gallery_images && vendor.gallery_images.length > 0 ? (
        <section className="my-4">
          <h2 className="h5">{labels.galleryHeading}</h2>
          <GalleryCarousel vendorName={vendor.business_name} images={vendor.gallery_images} />
        </section>
      ) : null}

      <hr className="my-4" />

      {children}

      <div className="alert alert-info mt-4">{labels.moreComing}</div>
    </main>
  );
}

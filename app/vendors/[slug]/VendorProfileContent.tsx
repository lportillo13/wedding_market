"use client";

import Image from "next/image";
import type { PointerEvent as ReactPointerEvent, ReactNode, TransitionEvent } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pointerState = useRef<{
    id: number | null;
    startX: number;
    lastX: number;
    dragging: boolean;
  }>({ id: null, startX: 0, lastX: 0, dragging: false });

  const slideCount = images.length;
  const hasLoop = slideCount > 1;

  const slides = useMemo(() => {
    if (!slideCount) return [] as { image: VendorImage; key: string }[];
    if (!hasLoop) {
      return images.map((image) => ({ image, key: image.public_id }));
    }

    const firstImage = images[0]!;
    const lastImage = images[slideCount - 1]!;

    return [
      { image: lastImage, key: `${lastImage.public_id}-clone-start` },
      ...images.map((image) => ({ image, key: image.public_id })),
      { image: firstImage, key: `${firstImage.public_id}-clone-end` },
    ];
  }, [hasLoop, images, slideCount]);

  const displayCount = slides.length;

  const [activeIndex, setActiveIndex] = useState(() => (hasLoop ? 1 : 0));
  const [offset, setOffset] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [disableTransition, setDisableTransition] = useState(false);

  useEffect(() => {
    slideRefs.current = [];
    // Reset to the first logical slide whenever the gallery size changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIndex((prev) => {
      const nextIndex = hasLoop ? 1 : 0;
      return prev === nextIndex ? prev : nextIndex;
    });
  }, [hasLoop, slideCount]);

  useEffect(() => {
    slideRefs.current = slideRefs.current.slice(0, displayCount);
  }, [displayCount]);

  const currentLogicalIndex = slideCount
    ? hasLoop
      ? ((activeIndex - 1 + slideCount) % slideCount)
      : Math.min(activeIndex, slideCount - 1)
    : 0;

  const updateOffset = useCallback(
    (index: number) => {
      if (index < 0 || index >= slideRefs.current.length) return;

      const track = trackRef.current;
      const slide = slideRefs.current[index] ?? null;
      const viewport = viewportRef.current;
      if (!track || !slide || !viewport) return;

      const viewportWidth = viewport.clientWidth;
      const slideWidth = slide.clientWidth;
      const slideLeft = slide.offsetLeft;
      const centeredOffset = slideLeft - (viewportWidth - slideWidth) / 2;
      setOffset(centeredOffset);
    },
    []
  );

  useLayoutEffect(() => {
    updateOffset(activeIndex);
  }, [activeIndex, displayCount, updateOffset]);

  useEffect(() => {
    const handleResize = () => updateOffset(activeIndex);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeIndex, updateOffset]);

  const goToSlide = useCallback(
    (nextIndex: number) => {
      if (!slideCount) return;
      const normalized = ((nextIndex % slideCount) + slideCount) % slideCount;
      if (hasLoop) {
        setActiveIndex(normalized + 1);
      } else {
        setActiveIndex(normalized);
      }
    },
    [hasLoop, slideCount]
  );

  const handlePrev = useCallback(() => {
    if (!slideCount) return;
    setActiveIndex((prev) => {
      if (hasLoop) {
        return prev <= 0 ? prev : prev - 1;
      }
      return Math.max(prev - 1, 0);
    });
  }, [hasLoop, slideCount]);

  const handleNext = useCallback(() => {
    if (!slideCount) return;
    setActiveIndex((prev) => {
      if (hasLoop) {
        return prev >= displayCount - 1 ? prev : prev + 1;
      }
      return Math.min(prev + 1, slideCount - 1);
    });
  }, [displayCount, hasLoop, slideCount]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;
    track.setPointerCapture(event.pointerId);
    setIsDragging(true);
    pointerState.current = {
      id: event.pointerId,
      startX: event.clientX,
      lastX: event.clientX,
      dragging: true,
    };
  }, []);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const state = pointerState.current;
    if (!state.dragging || state.id !== event.pointerId) return;
    const delta = event.clientX - state.startX;
    state.lastX = event.clientX;
    setDragOffset(-delta);
  }, []);

  const finishPointer = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const state = pointerState.current;
      if (!state.dragging || state.id !== event.pointerId) return;

      const delta = event.clientX - state.startX;
      const threshold = 60;
      const track = trackRef.current;
      if (track && track.hasPointerCapture(event.pointerId)) {
        track.releasePointerCapture(event.pointerId);
      }
      pointerState.current = { id: null, startX: 0, lastX: 0, dragging: false };
      setDragOffset(0);
      setIsDragging(false);

      if (delta < -threshold) {
        handleNext();
      } else if (delta > threshold) {
        handlePrev();
      }
    },
    [handleNext, handlePrev]
  );

  useEffect(() => {
    if (!disableTransition) return;
    const id = requestAnimationFrame(() => {
      setDisableTransition(false);
    });
    return () => cancelAnimationFrame(id);
  }, [disableTransition]);

  const handleTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return;
      if (!hasLoop || displayCount === 0) return;

      if (activeIndex === 0) {
        setDisableTransition(true);
        setActiveIndex(slideCount);
      } else if (activeIndex === displayCount - 1) {
        setDisableTransition(true);
        setActiveIndex(1);
      }
    },
    [activeIndex, displayCount, hasLoop, slideCount]
  );

  const trackStyle = {
    transform: `translate3d(${-offset + dragOffset}px, 0, 0)`,
    transition: isDragging || disableTransition ? "none" : undefined,
  };

  return (
    <div className="vendor-gallery-swiper">
      <div className="vendor-gallery-swiper__viewport" ref={viewportRef}>
        <div
          ref={trackRef}
          className="vendor-gallery-swiper__track"
          role="group"
          aria-label={`${vendorName} gallery images`}
          style={trackStyle}
          onTransitionEnd={handleTransitionEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointer}
          onPointerLeave={finishPointer}
          onPointerCancel={finishPointer}
        >
          {slides.map(({ image, key }, index) => {
            const aspectRatio = image.width && image.height ? `${image.width} / ${image.height}` : "4 / 3";
            return (
              <div
                className="vendor-gallery-swiper__slide"
                key={key}
                ref={(el) => {
                  slideRefs.current[index] = el;
                }}
              >
                <div className="vendor-gallery-swiper__figure" style={{ aspectRatio }}>
                  <Image
                    src={image.url}
                    alt={`${vendorName} gallery image`}
                    fill
                    sizes="(max-width: 960px) 100vw, 480px"
                    className="vendor-gallery-swiper__image"
                    priority={false}
                    onLoadingComplete={() => {
                      if (index === activeIndex) {
                        updateOffset(index);
                      }
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {slideCount > 1 ? (
        <>
          <div className="vendor-gallery-swiper__controls" aria-hidden="true">
            <button type="button" className="vendor-gallery-swiper__control btn btn-light btn-sm" onClick={handlePrev}>
              ‹
            </button>
            <button type="button" className="vendor-gallery-swiper__control btn btn-light btn-sm" onClick={handleNext}>
              ›
            </button>
          </div>
          <div className="vendor-gallery-swiper__pagination" role="tablist" aria-label={`${vendorName} gallery pagination`}>
            {images.map((image, index) => (
              <button
                key={image.public_id}
                type="button"
                className={
                  index === currentLogicalIndex
                    ? "vendor-gallery-swiper__bullet vendor-gallery-swiper__bullet--active"
                    : "vendor-gallery-swiper__bullet"
                }
                onClick={() => goToSlide(index)}
                aria-label={`${vendorName} gallery image ${index + 1}`}
                aria-current={index === currentLogicalIndex ? "true" : undefined}
              />
            ))}
          </div>
        </>
      ) : null}
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
  const extraInfo =
    language === "es"
      ? vendor.extra_info_es || vendor.extra_info_en
      : vendor.extra_info_en || vendor.extra_info_es;

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

      {bio ? <p className="lead" style={{ whiteSpace: "pre-wrap" }}>{bio}</p> : null}

      {extraInfo ? (
        <section className="mt-4">
          <h2 className="h5">{labels.extraInfoHeading}</h2>
          <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{extraInfo}</p>
        </section>
      ) : null}

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

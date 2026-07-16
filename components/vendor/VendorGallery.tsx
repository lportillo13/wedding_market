"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import { useLanguage } from "@/contexts/LanguageContext";
import { resolveMediaUrl, shouldRenderUnoptimizedMedia } from "@/lib/media-url";
import type { VendorMediaItem } from "@/types/vendor-profile";

function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

type VendorGalleryProps = {
  media: VendorMediaItem[];
  vendorName: string;
};

type LightboxState = {
  open: boolean;
  index: number;
};

function isVideo(item: VendorMediaItem) {
  return item.type === "video" || item.url.endsWith(".mp4") || item.url.includes("/video/");
}

export default function VendorGallery({ media, vendorName }: VendorGalleryProps) {
  const { dictionary, language } = useLanguage();
  const labels = dictionary.vendorPublic.gallery;
  const photos = useMemo(() => media.filter((item) => !isVideo(item)), [media]);
  const videos = useMemo(() => media.filter((item) => isVideo(item)), [media]);

  const buildCaptionTrackSrc = (text: string) => {
    const sanitized = text.replace(/\s+/g, " ").trim();
    const captionText = sanitized || labels.defaultVideoCaption;
    const vtt = `WEBVTT\n\n00:00.000 --> 00:10.000\n${captionText}`;
    return `data:text/vtt;charset=utf-8,${encodeURIComponent(vtt)}`;
  };

  const [lightbox, setLightbox] = useState<LightboxState>({ open: false, index: 0 });
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const hasGalleryMounted = useRef(false);

  const showGalleryPrev = useCallback(() => {
    if (!mainSwiper || photos.length < 2) return;
    const previousIndex = mainSwiper.activeIndex <= 0 ? photos.length - 1 : mainSwiper.activeIndex - 1;
    mainSwiper.slideTo(previousIndex);
  }, [mainSwiper, photos.length]);

  const showGalleryNext = useCallback(() => {
    if (!mainSwiper || photos.length < 2) return;
    const nextIndex = mainSwiper.activeIndex >= photos.length - 1 ? 0 : mainSwiper.activeIndex + 1;
    mainSwiper.slideTo(nextIndex);
  }, [mainSwiper, photos.length]);

  const selectGalleryPhoto = useCallback((index: number) => {
    mainSwiper?.slideTo(index);
  }, [mainSwiper]);

  useEffect(() => {
    if (!hasGalleryMounted.current) {
      hasGalleryMounted.current = true;
      return;
    }
    thumbnailRefs.current[activePhoto]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [activePhoto]);

  const openLightbox = useCallback((index: number) => {
    setLightbox({ open: true, index });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightbox({ open: false, index: 0 });
  }, []);

  const showPrev = useCallback(() => {
    if (!photos.length) return;
    setLightbox((prev) => ({
      open: true,
      index: prev.index === 0 ? Math.max(photos.length - 1, 0) : prev.index - 1,
    }));
  }, [photos.length]);

  const showNext = useCallback(() => {
    if (!photos.length) return;
    setLightbox((prev) => ({
      open: true,
      index: prev.index >= photos.length - 1 ? 0 : prev.index + 1,
    }));
  }, [photos.length]);

  useEffect(() => {
    if (!lightbox.open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowRight") showNext();
      if (event.key === "ArrowLeft") showPrev();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeLightbox, lightbox.open, showNext, showPrev]);

  const videoSuffix = videos.length === 1 ? "" : "s";

  return (
    <div className="wm-vendor-gallery-block">
      <div className="wm-vendor-gallery-heading">
        <div className="wm-vendor-gallery-heading__title">
          <span className="wm-vendor-gallery-heading__mark" aria-hidden="true" />
          <h2 className="mb-0">{labels.photosHeading}</h2>
        </div>
        {photos.length > 0 ? (
          <button
            type="button"
            className="wm-vendor-gallery-link"
            onClick={() => openLightbox(0)}
          >
            <span>{fill(labels.seeAll, { count: photos.length })}</span>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M7 4h9v9M16 4 5 15" />
            </svg>
          </button>
        ) : null}
      </div>

      {photos.length ? (
        <div className="wm-vendor-gallery-slider">
          <div className="wm-vendor-gallery-slider__stage">
            <Swiper
              spaceBetween={0}
              onSwiper={(swiper) => {
                setMainSwiper(swiper);
                setActivePhoto(swiper.activeIndex);
              }}
              onSlideChange={(swiper) => setActivePhoto(swiper.activeIndex)}
              className="wm-vendor-gallery-slider__main"
            >
              {photos.map((photo, index) => (
                <SwiperSlide key={photo.id}>
                  <button
                    type="button"
                    className="wm-vendor-gallery-slider__frame"
                    onClick={() => openLightbox(index)}
                    aria-label={`${labels.photosHeading} ${index + 1}`}
                  >
                    <div className="wm-vendor-gallery-slider__media">
                      <Image
                        src={resolveMediaUrl(photo.url)}
                        alt={photo.caption || `${vendorName} ${labels.photosHeading.toLowerCase()} ${index + 1}`}
                        fill
                        unoptimized={shouldRenderUnoptimizedMedia(photo.url)}
                        sizes="(max-width: 767px) 100vw, 84vw"
                        className="object-fit-cover"
                      />
                    </div>
                  </button>
                </SwiperSlide>
              ))}
            </Swiper>

            {photos.length > 1 ? (
              <>
                <button
                  type="button"
                  className="wm-vendor-gallery-slider__arrow wm-vendor-gallery-slider__arrow--prev"
                  onClick={showGalleryPrev}
                  aria-label={labels.previousPhoto}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m15 5-7 7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="wm-vendor-gallery-slider__arrow wm-vendor-gallery-slider__arrow--next"
                  onClick={showGalleryNext}
                  aria-label={labels.nextPhoto}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m9 5 7 7-7 7" />
                  </svg>
                </button>
              </>
            ) : null}
          </div>

          {photos.length > 1 ? (
            <div className="wm-vendor-gallery-slider__thumbs" role="tablist" aria-label={labels.photosHeading}>
              {photos.map((photo, index) => (
                <button
                  key={`${photo.id}-thumb`}
                  ref={(node) => {
                    thumbnailRefs.current[index] = node;
                  }}
                  type="button"
                  role="tab"
                  className={`wm-vendor-gallery-slider__thumb${activePhoto === index ? " is-active" : ""}`}
                  onClick={() => selectGalleryPhoto(index)}
                  aria-label={`${labels.photosHeading} ${index + 1}`}
                  aria-selected={activePhoto === index}
                >
                  <span className="wm-vendor-gallery-slider__thumb-media">
                    <Image
                      src={resolveMediaUrl(photo.url)}
                      alt=""
                      fill
                      unoptimized={shouldRenderUnoptimizedMedia(photo.url)}
                      sizes="180px"
                      className="object-fit-cover"
                    />
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {videos.length > 0 && (
        <>
          <div className="d-flex flex-wrap justify-content-between align-items-end mt-5 mb-3">
            <div>
              <p className="wm-admin-kicker mb-1">Motion</p>
              <h3 className="h3 mb-0">{labels.videosHeading}</h3>
            </div>
            <span className="text-muted">{fill(labels.videoCount, { count: videos.length, suffix: videoSuffix })}</span>
          </div>
          <div className="row g-4">
            {videos.map((video) => (
              <div className="col-12 col-lg-6" key={video.id}>
                <div className="wm-vendor-video-card">
                  <div className="ratio ratio-16x9 overflow-hidden rounded-4 bg-black">
                    <video controls className="w-100 h-100" preload="metadata">
                      <source src={resolveMediaUrl(video.url)} />
                      <track
                        kind="captions"
                        srcLang={language}
                        label={labels.captionsLabel}
                        src={buildCaptionTrackSrc(video.caption ?? `${vendorName} video`)}
                        default
                      />
                      {labels.unsupportedVideo}
                    </video>
                  </div>
                  {video.caption ? <p className="text-muted small mt-3 mb-0">{video.caption}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {lightbox.open && photos.length > 0 ? (
        <div className="wm-vendor-lightbox" role="dialog" aria-modal="true" aria-label={labels.photosHeading}>
          <div className="wm-vendor-lightbox__topbar">
            <span>
              {String(lightbox.index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
            </span>
            <button type="button" className="wm-vendor-lightbox__close" onClick={closeLightbox} aria-label={labels.close}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m5 5 14 14M19 5 5 19" />
              </svg>
            </button>
          </div>
          <div className="wm-vendor-lightbox__body">
            <button type="button" className="wm-vendor-lightbox__arrow" onClick={showPrev} aria-label={labels.previousPhoto}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m15 5-7 7 7 7" />
              </svg>
            </button>
            <div className="wm-vendor-lightbox__frame">
              <Image
                src={resolveMediaUrl((photos[lightbox.index] ?? photos[0]!).url)}
                alt={(photos[lightbox.index] ?? photos[0]!).caption || `${vendorName} ${labels.photosHeading.toLowerCase()} ${lightbox.index + 1}`}
                width={1400}
                height={1000}
                unoptimized={shouldRenderUnoptimizedMedia((photos[lightbox.index] ?? photos[0]!).url)}
                className="img-fluid"
              />
            </div>
            <button type="button" className="wm-vendor-lightbox__arrow" onClick={showNext} aria-label={labels.nextPhoto}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m9 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

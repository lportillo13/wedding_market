"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FreeMode, Navigation, Pagination, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/thumbs";
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
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

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
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowRight") showNext();
      if (event.key === "ArrowLeft") showPrev();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeLightbox, lightbox.open, showNext, showPrev]);

  const videoSuffix = videos.length === 1 ? "" : "s";

  return (
    <div className="wm-vendor-gallery-block">
      <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4">
        <div>
          <p className="wm-admin-kicker mb-1">Visual story</p>
          <h2 className="h2 mb-0">{labels.photosHeading}</h2>
        </div>
        {photos.length > 0 ? (
          <button
            type="button"
            className="wm-vendor-gallery-link"
            onClick={() => openLightbox(0)}
          >
            {fill(labels.seeAll, { count: photos.length })}
          </button>
        ) : null}
      </div>

      {photos.length ? (
        <div className="wm-vendor-gallery-slider">
          <Swiper
            modules={[Navigation, Pagination, Thumbs]}
            navigation
            pagination={{ clickable: true }}
            spaceBetween={16}
            thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
            className="wm-vendor-gallery-slider__main"
          >
            {photos.map((photo, index) => (
              <SwiperSlide key={photo.id}>
                <button
                  type="button"
                  className="wm-vendor-gallery-slider__frame"
                  onClick={() => openLightbox(index)}
                >
                  <div className="wm-vendor-gallery-slider__media">
                    <Image
                      src={resolveMediaUrl(photo.url)}
                      alt={photo.caption || vendorName}
                      fill
                      unoptimized={shouldRenderUnoptimizedMedia(photo.url)}
                      sizes="100vw"
                      className="object-fit-cover"
                    />
                  </div>
                </button>
              </SwiperSlide>
            ))}
          </Swiper>

          {photos.length > 1 ? (
            <Swiper
              modules={[FreeMode, Thumbs]}
              onSwiper={setThumbsSwiper}
              watchSlidesProgress
              freeMode
              spaceBetween={12}
              slidesPerView={2.4}
              breakpoints={{
                576: { slidesPerView: 3.2 },
                768: { slidesPerView: 4.2 },
                992: { slidesPerView: 5.2 },
              }}
              className="wm-vendor-gallery-slider__thumbs"
            >
              {photos.map((photo) => (
                <SwiperSlide key={`${photo.id}-thumb`}>
                  <div className="wm-vendor-gallery-slider__thumb">
                    <div className="wm-vendor-gallery-slider__thumb-media">
                      <Image
                        src={resolveMediaUrl(photo.url)}
                        alt={photo.caption || vendorName}
                        fill
                        unoptimized={shouldRenderUnoptimizedMedia(photo.url)}
                        sizes="240px"
                        className="object-fit-cover"
                      />
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
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
        <div className="wm-vendor-lightbox" role="dialog" aria-modal="true">
          <button type="button" className="btn btn-light position-absolute top-0 end-0 m-3" onClick={closeLightbox}>
            {labels.close}
          </button>
          <div className="wm-vendor-lightbox__body">
            <button type="button" className="btn btn-outline-light" onClick={showPrev} aria-label={labels.previousPhoto}>
              ‹
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
            <button type="button" className="btn btn-outline-light" onClick={showNext} aria-label={labels.nextPhoto}>
              ›
            </button>
          </div>
          {(photos[lightbox.index] ?? photos[0]!).caption ? (
            <p className="text-white mt-3 mb-0">{(photos[lightbox.index] ?? photos[0]!).caption}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { VendorMediaItem } from "@/types/vendor-profile";

function buildCaptionTrackSrc(text: string) {
  const sanitized = text.replace(/\s+/g, " ").trim();
  const captionText = sanitized || "Video with descriptive audio";
  const vtt = `WEBVTT\n\n00:00.000 --> 00:10.000\n${captionText}`;
  return `data:text/vtt;charset=utf-8,${encodeURIComponent(vtt)}`;
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
  const photos = useMemo(() => media.filter((item) => !isVideo(item)), [media]);
  const videos = useMemo(() => media.filter((item) => isVideo(item)), [media]);

  const [lightbox, setLightbox] = useState<LightboxState>({ open: false, index: 0 });

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

  const renderLightbox = () => {
    if (!lightbox.open || photos.length === 0) return null;
    const photo = photos[lightbox.index] ?? photos[0]!;
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="position-fixed top-0 start-0 end-0 bottom-0 bg-dark bg-opacity-75 d-flex flex-column align-items-center justify-content-center"
        style={{ zIndex: 1050 }}
      >
        <button type="button" className="btn btn-light position-absolute top-0 end-0 m-3" onClick={closeLightbox}>
          Close
        </button>
        <div className="d-flex align-items-center justify-content-center gap-3 w-100 px-4">
          <button
            type="button"
            className="btn btn-outline-light"
            onClick={showPrev}
            aria-label="Previous photo"
          >
            ‹
          </button>
          <div className="bg-white rounded overflow-hidden" style={{ maxHeight: "80vh", maxWidth: "90vw" }}>
            <Image
              src={photo.url}
              alt={photo.caption || `${vendorName} photo ${lightbox.index + 1}`}
              width={1200}
              height={800}
              className="img-fluid"
            />
          </div>
          <button
            type="button"
            className="btn btn-outline-light"
            onClick={showNext}
            aria-label="Next photo"
          >
            ›
          </button>
        </div>
        {photo.caption ? <p className="text-white mt-3">{photo.caption}</p> : null}
      </div>
    );
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h3 mb-0">Photos</h2>
        {photos.length > 0 ? <span className="text-muted">See all ({photos.length})</span> : null}
      </div>
      {photos.length ? (
        <div className="row g-2">
          {photos.slice(0, 6).map((photo, index) => (
            <div className="col-12 col-sm-6 col-lg-4" key={photo.id}>
              <button
                type="button"
                className="btn p-0 border-0 w-100 position-relative overflow-hidden"
                onClick={() => openLightbox(index)}
              >
                <div className="ratio ratio-4x3 bg-light-subtle">
                  <Image
                    src={photo.url}
                    alt={photo.caption || vendorName}
                    fill
                    sizes="(max-width: 576px) 100vw, (max-width: 992px) 50vw, 33vw"
                    className="object-fit-cover"
                  />
                </div>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted">No photos uploaded yet.</p>
      )}

      <div className="d-flex justify-content-between align-items-center mt-5 mb-3">
        <h3 className="h4 mb-0">Videos</h3>
        {videos.length ? <span className="text-muted">{videos.length} video{videos.length > 1 ? "s" : ""}</span> : null}
      </div>
      {videos.length ? (
        <div className="row g-3">
          {videos.map((video) => (
            <div className="col-12 col-md-6" key={video.id}>
              <div className="ratio ratio-16x9 rounded overflow-hidden bg-black">
                <video controls className="w-100 h-100" preload="metadata">
                  <source src={video.url} />
                  <track
                    kind="captions"
                    srcLang="en"
                    label="English captions"
                    src={buildCaptionTrackSrc(video.caption ?? `${vendorName} video`)}
                    default
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
              {video.caption ? <p className="text-muted small mt-2">{video.caption}</p> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted">No videos available.</p>
      )}
      {renderLightbox()}
    </div>
  );
}

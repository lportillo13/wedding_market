"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { useTranslation } from "@/contexts/LanguageContext";
import { uploadWithProgress } from "@/lib/client/uploads";
import { resolveMediaUrl, shouldRenderUnoptimizedMedia } from "@/lib/media-url";
import type { VendorImage } from "@/types/vendor";
import {
  removeGalleryImage,
  removeHeroImage,
  removeThumbnailImage,
  type ImageActionState,
} from "./actions";

const initialState: ImageActionState = { ok: false, message: "" };

type ImagesFormProps = {
  vendorName: string;
  heroImage: VendorImage | null;
  thumbnailImage: VendorImage | null;
  galleryImages: VendorImage[];
};

function ActionMessage({ state }: { state: ImageActionState }) {
  if (!state.message) return null;
  return (
    <div className={`alert ${state.ok ? "alert-success" : "alert-danger"} mt-2`} role="status">
      {state.message}
    </div>
  );
}

function buildCaptionTrackSrc(text: string) {
  const vtt = `WEBVTT\n\n00:00.000 --> 00:10.000\n${text.replace(/\s+/g, " ").trim() || "Video"}`;
  return `data:text/vtt;charset=utf-8,${encodeURIComponent(vtt)}`;
}

function ProgressBar({ pending, progress }: { pending: boolean; progress: number }) {
  if (!pending && progress <= 0) return null;
  return (
    <div className="mt-2">
      <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${progress}%` }}>
          {progress}%
        </div>
      </div>
    </div>
  );
}

function UploadMeta({
  pending,
  progress,
  selection,
  tone = "default",
}: {
  pending: boolean;
  progress: number;
  selection: string[];
  tone?: "default" | "warm";
}) {
  if (!pending && selection.length === 0) return null;
  return (
    <div className={`wm-vendor-media-status ${tone === "warm" ? "wm-vendor-media-status--warm" : ""}`}>
      <div className="d-flex align-items-center justify-content-between gap-3">
        <div className="min-w-0">
          <div className="fw-semibold text-dark">
            {pending
              ? `Uploading ${selection.length || 1} file${selection.length === 1 ? "" : "s"}`
              : `Selected ${selection.length} file${selection.length === 1 ? "" : "s"}`}
          </div>
          {selection.length > 0 ? (
            <div className="small text-secondary text-truncate">
              {selection.slice(0, 3).join(", ")}
              {selection.length > 3 ? ` +${selection.length - 3} more` : ""}
            </div>
          ) : null}
        </div>
        <div className="wm-vendor-media-status__badge">{progress}%</div>
      </div>
      <ProgressBar pending={pending || progress > 0} progress={progress} />
    </div>
  );
}

export default function ImagesForm({ vendorName, heroImage, thumbnailImage, galleryImages }: ImagesFormProps) {
  const router = useRouter();
  const t = useTranslation();
  const [heroState, setHeroState] = useState(initialState);
  const [thumbState, setThumbState] = useState(initialState);
  const [galleryState, setGalleryState] = useState(initialState);
  const [videoState, setVideoState] = useState(initialState);
  const [heroPending, setHeroPending] = useState(false);
  const [thumbPending, setThumbPending] = useState(false);
  const [galleryPending, setGalleryPending] = useState(false);
  const [videoPending, setVideoPending] = useState(false);
  const [heroProgress, setHeroProgress] = useState(0);
  const [thumbProgress, setThumbProgress] = useState(0);
  const [galleryProgress, setGalleryProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [heroSelection, setHeroSelection] = useState<string[]>([]);
  const [thumbSelection, setThumbSelection] = useState<string[]>([]);
  const [gallerySelection, setGallerySelection] = useState<string[]>([]);
  const [videoSelection, setVideoSelection] = useState<string[]>([]);
  const [deleteState, deleteAction, deletePending] = useActionState(removeGalleryImage, initialState);
  const [deleteHeroState, deleteHeroAction, deleteHeroPending] = useActionState(removeHeroImage, initialState);
  const [deleteThumbState, deleteThumbAction, deleteThumbPending] = useActionState(removeThumbnailImage, initialState);
  const photoItems = galleryImages.filter((asset) => asset.type !== "video");
  const videoItems = galleryImages.filter((asset) => asset.type === "video");

  async function uploadSingle(
    formData: FormData,
    target: "vendor-hero" | "vendor-thumbnail",
    setPending: (value: boolean) => void,
    setProgress: (value: number) => void,
    setState: (value: ImageActionState) => void,
    clearSelection: () => void
  ) {
    try {
      setPending(true);
      setProgress(0);
      setState(initialState);
      const file = formData.get(target === "vendor-hero" ? "hero" : "thumbnail");
      if (!(file instanceof File)) {
        throw new Error("Please choose an image.");
      }
      const payload = new FormData();
      payload.set("target", target);
      payload.set("file", file);
      await uploadWithProgress("/api/uploads", payload, setProgress);
      setState({ ok: true, message: target === "vendor-hero" ? "Hero image updated." : "Thumbnail image updated." });
      clearSelection();
      setProgress(0);
      router.refresh();
    } catch (error) {
      setState({ ok: false, message: error instanceof Error ? error.message : "Upload failed." });
    } finally {
      setPending(false);
    }
  }

  async function uploadMultiple(
    formData: FormData,
    target: "vendor-gallery" | "vendor-video",
    setPending: (value: boolean) => void,
    setProgress: (value: number) => void,
    setState: (value: ImageActionState) => void,
    clearSelection: () => void
  ) {
    try {
      setPending(true);
      setProgress(0);
      setState(initialState);
      const files = formData
        .getAll(target === "vendor-gallery" ? "gallery" : "videos")
        .filter((entry): entry is File => entry instanceof File && entry.size > 0);
      if (files.length === 0) {
        throw new Error(`Please choose at least one ${target === "vendor-gallery" ? "image" : "video"}.`);
      }
      const payload = new FormData();
      payload.set("target", target);
      for (const file of files) {
        payload.append("files", file);
      }
      await uploadWithProgress("/api/uploads", payload, setProgress);
      setState({
        ok: true,
        message: target === "vendor-gallery" ? "Gallery updated." : "Video upload completed.",
      });
      clearSelection();
      setProgress(0);
      router.refresh();
    } catch (error) {
      setState({ ok: false, message: error instanceof Error ? error.message : "Upload failed." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="wm-vendor-media-manager">
      <h2 className="h5">{t("vendorDashboard.profileImages.heading")}</h2>
      <p className="text-muted small">{t("vendorDashboard.profileImages.help")}</p>

      <div className="wm-vendor-media-grid">
        <section className="wm-vendor-media-card">
          <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
            <div>
              <h3 className="h6 mb-1">{t("vendorDashboard.profileImages.heroLabel")}</h3>
              <p className="small text-muted mb-0">Large editorial image for the top of your public profile.</p>
            </div>
            {heroImage?.url ? (
              <form action={deleteHeroAction}>
                <button className="btn btn-outline-danger btn-sm" disabled={deleteHeroPending} type="submit">
                  {deleteHeroPending ? t("vendorDashboard.profileImages.removing") : t("vendorDashboard.profileImages.remove")}
                </button>
              </form>
            ) : null}
          </div>

          {heroImage?.url ? (
            <div className="mb-2 wm-vendor-media-preview wm-vendor-media-preview--hero">
              <Image
                src={resolveMediaUrl(heroImage.url)}
                alt={`${vendorName} hero`}
                width={heroImage.width}
                height={heroImage.height}
                unoptimized={shouldRenderUnoptimizedMedia(heroImage.url)}
                className="w-100 rounded"
                sizes="(max-width: 768px) 100vw, 400px"
              />
              <div className="small text-muted mt-2">
                {heroImage.width} x {heroImage.height} • {heroImage.format.toUpperCase()}
              </div>
            </div>
          ) : (
            <p className="text-muted small mb-2">{t("vendorDashboard.profileImages.heroEmpty")}</p>
          )}

          <form action={(formData) => uploadSingle(formData, "vendor-hero", setHeroPending, setHeroProgress, setHeroState, () => setHeroSelection([]))} encType="multipart/form-data">
            <div className="mb-2">
              <input
                className="form-control"
                type="file"
                name="hero"
                accept="image/*"
                required
                onChange={(event) => setHeroSelection(event.target.files?.[0] ? [event.target.files[0].name] : [])}
              />
            </div>
            <button className="btn btn-primary btn-sm" disabled={heroPending} type="submit">
              {heroPending ? t("vendorDashboard.profileImages.uploading") : t("vendorDashboard.profileImages.uploadSingle")}
            </button>
          </form>
          <UploadMeta pending={heroPending} progress={heroProgress} selection={heroSelection} tone="warm" />
          <ActionMessage state={heroState} />
          <ActionMessage state={deleteHeroState} />
        </section>

        <section className="wm-vendor-media-card">
          <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
            <div>
              <h3 className="h6 mb-1">{t("vendorDashboard.profileImages.thumbnailLabel")}</h3>
              <p className="small text-muted mb-0">Square image used for cards and compact previews.</p>
            </div>
            {thumbnailImage?.url ? (
              <form action={deleteThumbAction}>
                <button className="btn btn-outline-danger btn-sm" disabled={deleteThumbPending} type="submit">
                  {deleteThumbPending ? t("vendorDashboard.profileImages.removing") : t("vendorDashboard.profileImages.remove")}
                </button>
              </form>
            ) : null}
          </div>

          {thumbnailImage?.url ? (
            <div className="mb-2 wm-vendor-media-preview wm-vendor-media-preview--thumb">
              <Image
                src={resolveMediaUrl(thumbnailImage.url)}
                alt={`${vendorName} thumbnail`}
                width={thumbnailImage.width}
                height={thumbnailImage.height}
                unoptimized={shouldRenderUnoptimizedMedia(thumbnailImage.url)}
                className="rounded"
                style={{ maxWidth: "180px", height: "auto" }}
              />
              <div className="small text-muted mt-2">
                {thumbnailImage.width} x {thumbnailImage.height} • {thumbnailImage.format.toUpperCase()}
              </div>
            </div>
          ) : (
            <p className="text-muted small mb-2">{t("vendorDashboard.profileImages.thumbnailEmpty")}</p>
          )}

          <form action={(formData) => uploadSingle(formData, "vendor-thumbnail", setThumbPending, setThumbProgress, setThumbState, () => setThumbSelection([]))} encType="multipart/form-data">
            <div className="mb-2">
              <input
                className="form-control"
                type="file"
                name="thumbnail"
                accept="image/*"
                required
                onChange={(event) => setThumbSelection(event.target.files?.[0] ? [event.target.files[0].name] : [])}
              />
            </div>
            <button className="btn btn-primary btn-sm" disabled={thumbPending} type="submit">
              {thumbPending ? t("vendorDashboard.profileImages.uploading") : t("vendorDashboard.profileImages.uploadSingle")}
            </button>
          </form>
          <UploadMeta pending={thumbPending} progress={thumbProgress} selection={thumbSelection} />
          <ActionMessage state={thumbState} />
          <ActionMessage state={deleteThumbState} />
        </section>
      </div>

      <section className="wm-vendor-media-card">
        <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
          <div>
            <h3 className="h6 mb-1">{t("vendorDashboard.profileImages.galleryLabel")}</h3>
            <p className="text-muted small mb-0">{t("vendorDashboard.profileImages.galleryHelp")}</p>
          </div>
          <div className="wm-vendor-media-status__badge">{photoItems.length}/20</div>
        </div>

        {photoItems.length === 0 ? (
          <p className="text-muted small">{t("vendorDashboard.profileImages.galleryEmpty")}</p>
        ) : (
          <div className="wm-vendor-media-mosaic mb-3">
            {photoItems.map((image) => (
              <div className="wm-vendor-media-mosaic__item" key={image.public_id}>
                <div className="wm-vendor-media-tile h-100">
                  <Image
                    src={resolveMediaUrl(image.url)}
                    alt={`${vendorName} gallery`}
                    width={image.width}
                    height={image.height}
                    unoptimized={shouldRenderUnoptimizedMedia(image.url)}
                    className="w-100 rounded"
                    sizes="(max-width: 768px) 50vw, 200px"
                  />
                  <form action={deleteAction} className="d-grid mt-2">
                    <input type="hidden" name="public_id" value={image.public_id} />
                    <button className="btn btn-outline-danger btn-sm" disabled={deletePending} type="submit">
                      {deletePending ? t("vendorDashboard.profileImages.removing") : t("vendorDashboard.profileImages.remove")}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        <form action={(formData) => uploadMultiple(formData, "vendor-gallery", setGalleryPending, setGalleryProgress, setGalleryState, () => setGallerySelection([]))} encType="multipart/form-data">
          <div className="mb-2">
            <input
              className="form-control"
              type="file"
              name="gallery"
              accept="image/*"
              multiple
              required
              onChange={(event) => setGallerySelection(Array.from(event.target.files ?? []).map((file) => file.name))}
            />
          </div>
          <button className="btn btn-primary btn-sm" disabled={galleryPending} type="submit">
            {galleryPending ? t("vendorDashboard.profileImages.uploading") : t("vendorDashboard.profileImages.uploadMultiple")}
          </button>
        </form>
        <UploadMeta pending={galleryPending} progress={galleryProgress} selection={gallerySelection} tone="warm" />
        <div className="form-text mt-1 mb-3">{t("vendorDashboard.profileImages.gallerySelectHelp")}</div>
        <ActionMessage state={galleryState} />
        <ActionMessage state={deleteState} />
      </section>

      <section className="wm-vendor-media-card">
        <h3 className="h6">{t("vendorPublic.gallery.videosHeading")}</h3>
        <p className="text-muted small mb-3">Upload videos to your vendor profile. They will be converted to MP4 and capped at 50MB.</p>
        {videoItems.length > 0 ? (
          <div className="row row-cols-1 row-cols-md-2 g-3 mb-3">
            {videoItems.map((video) => (
              <div className="col" key={video.public_id}>
                <div className="wm-vendor-media-tile h-100">
                  <video controls className="w-100 rounded" preload="metadata">
                    <source src={resolveMediaUrl(video.url)} />
                    <track
                      kind="captions"
                      srcLang="en"
                      label="English captions"
                      src={buildCaptionTrackSrc(`${vendorName} video`)}
                      default
                    />
                  </video>
                  <form action={deleteAction} className="d-grid mt-2">
                    <input type="hidden" name="public_id" value={video.public_id} />
                    <button className="btn btn-outline-danger btn-sm" disabled={deletePending} type="submit">
                      {deletePending ? t("vendorDashboard.profileImages.removing") : t("vendorDashboard.profileImages.remove")}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <form action={(formData) => uploadMultiple(formData, "vendor-video", setVideoPending, setVideoProgress, setVideoState, () => setVideoSelection([]))} encType="multipart/form-data">
          <div className="mb-2">
            <input
              className="form-control"
              type="file"
              name="videos"
              accept="video/*"
              multiple
              required
              onChange={(event) => setVideoSelection(Array.from(event.target.files ?? []).map((file) => file.name))}
            />
          </div>
          <button className="btn btn-primary btn-sm" disabled={videoPending} type="submit">
            {videoPending ? t("vendorDashboard.profileImages.uploading") : "Upload videos"}
          </button>
        </form>
        <UploadMeta pending={videoPending} progress={videoProgress} selection={videoSelection} />
        <ActionMessage state={videoState} />
      </section>
    </div>
  );
}

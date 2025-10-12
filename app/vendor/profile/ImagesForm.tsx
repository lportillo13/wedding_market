"use client";

import Image from "next/image";
import { useActionState } from "react";
import { useTranslation } from "@/contexts/LanguageContext";
import type { VendorImage } from "@/types/vendor";
import {
  removeGalleryImage,
  type ImageActionState,
  uploadGalleryImage,
  uploadHeroImage,
  uploadThumbnailImage,
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

export default function ImagesForm({ vendorName, heroImage, thumbnailImage, galleryImages }: ImagesFormProps) {
  const t = useTranslation();
  const [heroState, heroAction, heroPending] = useActionState(uploadHeroImage, initialState);
  const [thumbState, thumbAction, thumbPending] = useActionState(uploadThumbnailImage, initialState);
  const [galleryState, galleryAction, galleryPending] = useActionState(uploadGalleryImage, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(removeGalleryImage, initialState);

  return (
    <section className="card">
      <div className="card-body">
        <h2 className="h5">{t("vendorDashboard.profileImages.heading")}</h2>
        <p className="text-muted small">{t("vendorDashboard.profileImages.help")}</p>

        <div className="mb-4">
          <h3 className="h6">{t("vendorDashboard.profileImages.heroLabel")}</h3>
          {heroImage?.url ? (
            <div className="mb-2">
              <Image
                src={heroImage.url}
                alt={`${vendorName} hero`}
                width={heroImage.width}
                height={heroImage.height}
                className="w-100 rounded"
                sizes="(max-width: 768px) 100vw, 400px"
              />
              <div className="small text-muted mt-1">
                {heroImage.width}×{heroImage.height} • {heroImage.format.toUpperCase()}
              </div>
            </div>
          ) : (
            <p className="text-muted small mb-2">{t("vendorDashboard.profileImages.heroEmpty")}</p>
          )}
          <form action={heroAction} encType="multipart/form-data">
            <div className="mb-2">
              <input className="form-control" type="file" name="hero" accept="image/*" required />
            </div>
            <button className="btn btn-primary btn-sm" disabled={heroPending} type="submit">
              {heroPending
                ? t("vendorDashboard.profileImages.uploading")
                : t("vendorDashboard.profileImages.upload")}
            </button>
          </form>
          <ActionMessage state={heroState} />
        </div>

        <div className="mb-4">
          <h3 className="h6">{t("vendorDashboard.profileImages.thumbnailLabel")}</h3>
          {thumbnailImage?.url ? (
            <div className="mb-2">
              <Image
                src={thumbnailImage.url}
                alt={`${vendorName} thumbnail`}
                width={thumbnailImage.width}
                height={thumbnailImage.height}
                className="rounded"
                style={{ maxWidth: "160px", height: "auto" }}
              />
              <div className="small text-muted mt-1">
                {thumbnailImage.width}×{thumbnailImage.height} • {thumbnailImage.format.toUpperCase()}
              </div>
            </div>
          ) : (
            <p className="text-muted small mb-2">{t("vendorDashboard.profileImages.thumbnailEmpty")}</p>
          )}
          <form action={thumbAction} encType="multipart/form-data">
            <div className="mb-2">
              <input className="form-control" type="file" name="thumbnail" accept="image/*" required />
            </div>
            <button className="btn btn-primary btn-sm" disabled={thumbPending} type="submit">
              {thumbPending
                ? t("vendorDashboard.profileImages.uploading")
                : t("vendorDashboard.profileImages.upload")}
            </button>
          </form>
          <ActionMessage state={thumbState} />
        </div>

        <div>
          <h3 className="h6">{t("vendorDashboard.profileImages.galleryLabel")}</h3>
          {galleryImages.length === 0 ? (
            <p className="text-muted small">{t("vendorDashboard.profileImages.galleryEmpty")}</p>
          ) : (
            <div className="row row-cols-2 g-2 mb-3">
              {galleryImages.map((image) => (
                <div className="col" key={image.public_id}>
                  <div className="border rounded p-2 h-100">
                    <Image
                      src={image.url}
                      alt={`${vendorName} gallery`}
                      width={image.width}
                      height={image.height}
                      className="w-100 rounded"
                      sizes="(max-width: 768px) 50vw, 200px"
                    />
                    <form action={deleteAction} className="d-grid mt-2">
                      <input type="hidden" name="public_id" value={image.public_id} />
                      <button className="btn btn-outline-danger btn-sm" disabled={deletePending} type="submit">
                        {deletePending
                          ? t("vendorDashboard.profileImages.removing")
                          : t("vendorDashboard.profileImages.remove")}
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
          <form action={galleryAction} encType="multipart/form-data">
            <div className="mb-2">
              <input className="form-control" type="file" name="gallery" accept="image/*" required />
            </div>
            <button className="btn btn-primary btn-sm" disabled={galleryPending} type="submit">
              {galleryPending
                ? t("vendorDashboard.profileImages.uploading")
                : t("vendorDashboard.profileImages.upload")}
            </button>
          </form>
          <ActionMessage state={galleryState} />
          <ActionMessage state={deleteState} />
        </div>
      </div>
    </section>
  );
}

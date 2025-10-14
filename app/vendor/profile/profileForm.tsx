"use client";

import { useActionState, useEffect, useState } from "react";
import type { SaveState } from "./actions";
import { saveProfile, translateProfileText } from "./actions";
import { useTranslation } from "@/contexts/LanguageContext";

type FormShape = {
  slug: string;
  business_name: string;
  bio_en: string;
  bio_es: string;
  extra_info_en: string;
  extra_info_es: string;
};

const actionInitial: SaveState = { ok: false, message: "" };

export default function ProfileForm({ initial }: { initial: FormShape }) {
  const [state, formAction, isPending] = useActionState(saveProfile, actionInitial);
  const [form, setForm] = useState<FormShape>(initial);
  const [isBioTranslating, setIsBioTranslating] = useState(false);
  const [isExtraTranslating, setIsExtraTranslating] = useState(false);
  const [bioTranslationError, setBioTranslationError] = useState<string | null>(null);
  const [extraTranslationError, setExtraTranslationError] = useState<string | null>(null);
  const t = useTranslation();

  // If the server sends new props (after save/revalidate), sync them
  useEffect(() => {
    setForm(initial);
  }, [initial]);

  // If the server action changed the slug, reflect it
  useEffect(() => {
    if (state.ok && state.slug)
      setForm((prev) => ({ ...prev, slug: state.slug ?? prev.slug }));
  }, [state.ok, state.slug]);

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  useEffect(() => {
    if (form.bio_en.trim()) {
      setBioTranslationError(null);
    }
  }, [form.bio_en]);

  useEffect(() => {
    if (form.extra_info_en.trim()) {
      setExtraTranslationError(null);
    }
  }, [form.extra_info_en]);

  async function handleTranslateBio() {
    if (!form.bio_en.trim()) {
      setBioTranslationError(t("vendorDashboard.profileForm.translationSourceMissing"));
      return;
    }

    setIsBioTranslating(true);
    setBioTranslationError(null);
    try {
      const result = await translateProfileText({
        sourceText: form.bio_en,
        sourceLanguageName: "English",
        targetLanguageName: "Spanish",
      });

      if (!result.ok || typeof result.translation !== "string") {
        setBioTranslationError(
          result.message ?? t("vendorDashboard.profileForm.translationFailed")
        );
        return;
      }

      setForm((prev) => ({ ...prev, bio_es: result.translation ?? "" }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setBioTranslationError(message || t("vendorDashboard.profileForm.translationFailed"));
    } finally {
      setIsBioTranslating(false);
    }
  }

  async function handleTranslateExtraInfo() {
    if (!form.extra_info_en.trim()) {
      setExtraTranslationError(t("vendorDashboard.profileForm.translationSourceMissing"));
      return;
    }

    setIsExtraTranslating(true);
    setExtraTranslationError(null);
    try {
      const result = await translateProfileText({
        sourceText: form.extra_info_en,
        sourceLanguageName: "English",
        targetLanguageName: "Spanish",
      });

      if (!result.ok || typeof result.translation !== "string") {
        setExtraTranslationError(
          result.message ?? t("vendorDashboard.profileForm.translationFailed")
        );
        return;
      }

      setForm((prev) => ({ ...prev, extra_info_es: result.translation ?? "" }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setExtraTranslationError(message || t("vendorDashboard.profileForm.translationFailed"));
    } finally {
      setIsExtraTranslating(false);
    }
  }

  return (
    <form action={formAction} suppressHydrationWarning>
      <div className="mb-3">
        <label className="form-label" htmlFor="profile-business-name">
          {t("vendorDashboard.profileForm.businessNameLabel")}
        </label>
        <input
          id="profile-business-name"
          name="business_name"
          className={`form-control ${state.fieldErrors?.business_name ? "is-invalid" : ""}`}
          value={form.business_name}
          onChange={onChange}
          required
        />
        {state.fieldErrors?.business_name && (
          <div className="invalid-feedback">{state.fieldErrors.business_name}</div>
        )}
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="profile-slug">
          {t("vendorDashboard.profileForm.slugLabel")}
        </label>
        <input
          id="profile-slug"
          name="slug"
          className={`form-control ${state.fieldErrors?.slug ? "is-invalid" : ""}`}
          value={form.slug}
          onChange={onChange}
          placeholder={t("vendorDashboard.profileForm.slugPlaceholder")}
        />
        {state.fieldErrors?.slug && <div className="invalid-feedback">{state.fieldErrors.slug}</div>}
        <div className="form-text">{t("vendorDashboard.profileForm.slugHelp")}</div>
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="profile-bio-en">
          {t("vendorDashboard.profileForm.bioEnLabel")}
        </label>
        <textarea
          id="profile-bio-en"
          name="bio_en"
          className="form-control"
          rows={4}
          value={form.bio_en}
          onChange={onChange}
        />
      </div>

      <div className="mb-3">
        <div className="d-flex align-items-start justify-content-between gap-2">
          <label className="form-label" htmlFor="profile-bio-es">
            {t("vendorDashboard.profileForm.bioEsLabel")}
          </label>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={handleTranslateBio}
            disabled={isBioTranslating || !form.bio_en.trim()}
          >
            {isBioTranslating
              ? t("vendorDashboard.profileForm.translating")
              : t("vendorDashboard.profileForm.translateFromEnglish")}
          </button>
        </div>
        <textarea
          id="profile-bio-es"
          name="bio_es"
          className="form-control"
          rows={4}
          value={form.bio_es}
          onChange={onChange}
        />
        {bioTranslationError ? (
          <div className="form-text text-danger">{bioTranslationError}</div>
        ) : null}
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="profile-extra-en">
          {t("vendorDashboard.profileForm.extraInfoEnLabel")}
        </label>
        <textarea
          id="profile-extra-en"
          name="extra_info_en"
          className="form-control"
          rows={4}
          value={form.extra_info_en}
          onChange={onChange}
        />
      </div>

      <div className="mb-3">
        <div className="d-flex align-items-start justify-content-between gap-2">
          <label className="form-label" htmlFor="profile-extra-es">
            {t("vendorDashboard.profileForm.extraInfoEsLabel")}
          </label>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={handleTranslateExtraInfo}
            disabled={isExtraTranslating || !form.extra_info_en.trim()}
          >
            {isExtraTranslating
              ? t("vendorDashboard.profileForm.translating")
              : t("vendorDashboard.profileForm.translateFromEnglish")}
          </button>
        </div>
        <textarea
          id="profile-extra-es"
          name="extra_info_es"
          className="form-control"
          rows={4}
          value={form.extra_info_es}
          onChange={onChange}
        />
        {extraTranslationError ? (
          <div className="form-text text-danger">{extraTranslationError}</div>
        ) : null}
      </div>

      {state.message && (
        <div className={`alert ${state.ok ? "alert-success" : "alert-danger"}`} role="alert">
          {state.message}
        </div>
      )}

      <button className="btn btn-primary" disabled={isPending}>
        {isPending ? t("vendorDashboard.profileForm.saving") : t("vendorDashboard.profileForm.save")}
      </button>
    </form>
  );
}

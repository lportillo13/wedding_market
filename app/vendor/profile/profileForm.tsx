"use client";

import { useProfileAction } from "./useProfileAction";
import ProfileSaveBar from "./ProfileSaveBar";

import { useEffect, useRef, useState } from "react";
import type { SaveState } from "./actions";
import { saveProfile, translateProfileText } from "./actions";
import { useLanguage, useTranslation } from "@/contexts/LanguageContext";
import {vendorStudioCopy} from "../workspace-navigation";

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
  const [state, formAction, isPending] = useProfileAction(saveProfile, actionInitial);
  const [form, setForm] = useState<FormShape>(initial);
  const [isBioTranslating, setIsBioTranslating] = useState(false);
  const [isExtraTranslating, setIsExtraTranslating] = useState(false);
  const [bioTranslationError, setBioTranslationError] = useState<string | null>(null);
  const [extraTranslationError, setExtraTranslationError] = useState<string | null>(null);
  const t = useTranslation();
  const {language} = useLanguage();
  const labels = vendorStudioCopy[language];
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok || !state.fieldErrors || !Object.keys(state.fieldErrors).length) return;
    const frame = requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>('.is-invalid')?.focus());
    return () => cancelAnimationFrame(frame);
  }, [state]);

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

  const description = (locale: 'en' | 'es') => <div className="mb-3">
    <div className="d-flex align-items-start justify-content-between gap-2">
      <label className="form-label" htmlFor={`profile-bio-${locale}`}>{locale === 'en' ? t('vendorDashboard.profileForm.bioEnLabel') : t('vendorDashboard.profileForm.bioEsLabel')}</label>
      {locale === 'es' && <button type="button" className="btn btn-outline-secondary btn-sm" data-profile-change onClick={handleTranslateBio} disabled={isBioTranslating || !form.bio_en.trim()}>{isBioTranslating ? t('vendorDashboard.profileForm.translating') : t('vendorDashboard.profileForm.translateFromEnglish')}</button>}
    </div>
    <textarea id={`profile-bio-${locale}`} name={`bio_${locale}`} className="form-control" rows={5} value={locale === 'en' ? form.bio_en : form.bio_es} onChange={onChange}/>
    {locale === 'es' && bioTranslationError && <div className="form-text text-danger">{bioTranslationError}</div>}
  </div>;
  const extra = (locale: 'en' | 'es') => <div className="mb-3">
    <div className="d-flex align-items-start justify-content-between gap-2">
      <label className="form-label" htmlFor={`profile-extra-${locale}`}>{locale === 'en' ? t('vendorDashboard.profileForm.extraInfoEnLabel') : t('vendorDashboard.profileForm.extraInfoEsLabel')}</label>
      {locale === 'es' && <button type="button" className="btn btn-outline-secondary btn-sm" data-profile-change onClick={handleTranslateExtraInfo} disabled={isExtraTranslating || !form.extra_info_en.trim()}>{isExtraTranslating ? t('vendorDashboard.profileForm.translating') : t('vendorDashboard.profileForm.translateFromEnglish')}</button>}
    </div>
    <textarea id={`profile-extra-${locale}`} name={`extra_info_${locale}`} className="form-control" rows={4} value={locale === 'en' ? form.extra_info_en : form.extra_info_es} onChange={onChange}/>
    {locale === 'es' && extraTranslationError && <div className="form-text text-danger">{extraTranslationError}</div>}
  </div>;
  return <form ref={formRef} action={formAction} data-profile-save suppressHydrationWarning>
    <div className="mb-4"><label className="form-label" htmlFor="profile-business-name">{t('vendorDashboard.profileForm.businessNameLabel')}</label><input id="profile-business-name" name="business_name" className={`form-control ${state.fieldErrors?.business_name ? 'is-invalid' : ''}`} value={form.business_name} onChange={onChange} required/>{state.fieldErrors?.business_name && <div className="invalid-feedback">{state.fieldErrors.business_name}</div>}</div>
    {description(language)}
    <details className="wm-studio-form-details"><summary>{labels.translation}</summary>{description(language === 'en' ? 'es' : 'en')}</details>
    <details className="wm-studio-form-details" open={Boolean(state.fieldErrors?.slug) || undefined}><summary>{labels.morePresentation}</summary>
      <div className="mb-3"><label className="form-label" htmlFor="profile-slug">{t('vendorDashboard.profileForm.slugLabel')}</label><input id="profile-slug" name="slug" className={`form-control ${state.fieldErrors?.slug ? 'is-invalid' : ''}`} value={form.slug} onChange={onChange} placeholder={t('vendorDashboard.profileForm.slugPlaceholder')}/>{state.fieldErrors?.slug && <div className="invalid-feedback">{state.fieldErrors.slug}</div>}<div className="form-text">{t('vendorDashboard.profileForm.slugHelp')}</div></div>
      {extra(language)}{extra(language === 'en' ? 'es' : 'en')}
    </details>
    <ProfileSaveBar state={state} pending={isPending} label={t('vendorDashboard.profileForm.save')}/>
  </form>;
}

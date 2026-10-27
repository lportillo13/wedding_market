'use client';

import Image from 'next/image';
import PasswordInput from '@/components/PasswordInput';
import { type ChangeEvent, type FormEvent, useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { buildCountryOptions } from '@/lib/countries';
import { vendorOnboardingCopy } from './presentation';
import { createVendor, type VendorSignUpState } from './actions';

type CategoryOption = {
  key: string;
  label: Record<string, unknown> | null;
};

const initialState: VendorSignUpState = { ok: false };

const eventTypeOptions = [
  'intimate-weddings',
  'destination-weekends',
  'large-receptions',
  'cultural-celebrations',
  'civil-ceremonies',
] as const;
const languageOptions = ['english', 'spanish', 'french', 'portuguese'] as const;
const teamSizeOptions = ['solo', 'small', 'growing', 'large'] as const;
const peakSeasonOptions = ['spring', 'summer', 'fall', 'winter'] as const;

type EventTypeValue = (typeof eventTypeOptions)[number];
type LanguageValue = (typeof languageOptions)[number];
type TeamSizeValue = (typeof teamSizeOptions)[number];
type PeakSeasonValue = (typeof peakSeasonOptions)[number];

type UploadPreview = {
  name: string;
  url: string;
};

type FormShape = {
  owner_name: string;
  email: string;
  password: string;
  business_name: string;
  tagline: string;
  categories: string[];
  city: string;
  state: string;
  country: string;
  service_radius_km: string;
  event_types: EventTypeValue[];
  service_style: string;
  phone: string;
  website_url: string;
  address_label: string;
  languages: LanguageValue[];
  other_languages: string;
  years_in_business: string;
  team_size_range: TeamSizeValue | '';
  starting_price: string;
  starting_price_currency: string;
  typical_spend: string;
  peak_seasons: PeakSeasonValue[];
  booking_lead_time: string;
  instagram_handle: string;
};

function resolveCategoryLabel(option: CategoryOption, language: 'en' | 'es') {
  const localized = option.label;
  if (localized && typeof localized === 'object') {
    const preferred = language === 'es' ? localized.es : localized.en;
    const fallback = language === 'es' ? localized.en : localized.es;
    if (typeof preferred === 'string' && preferred.trim()) return preferred;
    if (typeof fallback === 'string' && fallback.trim()) return fallback;
  }

  return option.key;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="wm-onboarding-summary__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default function VendorSignUpForm({
  categories,
  requiresAccount,
}: {
  categories: CategoryOption[];
  requiresAccount: boolean;
}) {
  const [state, action, pending] = useActionState(createVendor, initialState);
  const { dictionary, language } = useLanguage();
  const labels = dictionary.signup.vendor.form;
  const signupLabels = dictionary.signup.form;
  const dashboard = dictionary.vendorDashboard;
  const [step, setStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const copy = vendorOnboardingCopy[language];
  const [localError, setLocalError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadPreviews, setUploadPreviews] = useState<{
    hero: UploadPreview | null;
    logo: UploadPreview | null;
  }>({
    hero: null,
    logo: null,
  });
  const uploadPreviewsRef = useRef<{
    hero: UploadPreview | null;
    logo: UploadPreview | null;
  }>({
    hero: null,
    logo: null,
  });
  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<FormShape>({
    owner_name: '',
    email: '',
    password: '',
    business_name: '',
    tagline: '',
    categories: [],
    city: '',
    state: '',
    country: '',
    service_radius_km: '50',
    event_types: [],
    service_style: '',
    phone: '',
    website_url: '',
    address_label: '',
    languages: [],
    other_languages: '',
    years_in_business: '',
    team_size_range: '',
    starting_price: '',
    starting_price_currency: 'USD',
    typical_spend: '',
    peak_seasons: [],
    booking_lead_time: '',
    instagram_handle: '',
  });

  const steps = [
    ...(requiresAccount ? [{ id: 'account', ...copy.account }] : []),
    { id: 'brand', ...copy.brand }, { id: 'media', ...copy.media },
    { id: 'coverage', ...copy.coverage }, { id: 'contact', ...copy.contact },
    { id: 'pricing', ...copy.pricing },
  ];
  const activeStep = steps[step].id;
  function changeStep(next: number) {
    setLocalError(null);
    setStep(next);
    setFurthestStep(current => Math.max(current, next));
    requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true });
      headingRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }
  const progress = ((step + 1) / steps.length) * 100;
  const countryOptions = useMemo(() => buildCountryOptions(form.country), [form.country]);

  useEffect(() => {
    if (state.ok && state.redirectTo) {
      window.location.replace(state.redirectTo);
    }
  }, [state]);

  useEffect(() => {
    uploadPreviewsRef.current = uploadPreviews;
  }, [uploadPreviews]);

  useEffect(() => {
    return () => {
      Object.values(uploadPreviewsRef.current).forEach((preview) => {
        if (preview?.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, []);

  const localizedCategories = useMemo(
    () =>
      categories
        .map((item) => ({
          key: item.key,
          label: resolveCategoryLabel(item, language),
        }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [categories, language],
  );

  const visibleCategories = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return localizedCategories;
    return localizedCategories.filter(
      (item) => item.label.toLowerCase().includes(query) || item.key.toLowerCase().includes(query),
    );
  }, [localizedCategories, searchTerm]);

  const eventTypeLabels: Record<EventTypeValue, string> = {
    'intimate-weddings': labels.options.eventTypes['intimate-weddings'],
    'destination-weekends': labels.options.eventTypes['destination-weekends'],
    'large-receptions': labels.options.eventTypes['large-receptions'],
    'cultural-celebrations': labels.options.eventTypes['cultural-celebrations'],
    'civil-ceremonies': labels.options.eventTypes['civil-ceremonies'],
  };

  const languageLabels: Record<LanguageValue, string> = {
    english: labels.options.languages.english,
    spanish: labels.options.languages.spanish,
    french: labels.options.languages.french,
    portuguese: labels.options.languages.portuguese,
  };

  const teamSizeLabels: Record<TeamSizeValue, string> = {
    solo: labels.options.teamSizes.solo,
    small: labels.options.teamSizes.small,
    growing: labels.options.teamSizes.growing,
    large: labels.options.teamSizes.large,
  };

  const seasonLabels: Record<PeakSeasonValue, string> = {
    spring: labels.options.seasons.spring,
    summer: labels.options.seasons.summer,
    fall: labels.options.seasons.fall,
    winter: labels.options.seasons.winter,
  };

  function updateField(name: keyof FormShape, value: string) {
    setLocalError(null);
    setForm((current) => ({ ...current, [name]: value }));
  }

  function toggleArrayValue(field: 'categories' | 'event_types' | 'languages' | 'peak_seasons', value: string) {
    setLocalError(null);
    setForm((current) => {
      const currentValues = current[field] as string[];
      return {
        ...current,
        [field]: currentValues.includes(value)
          ? currentValues.filter((item) => item !== value)
          : [...currentValues, value],
      };
    });
  }

  function updateUploadPreview(field: 'hero' | 'logo', event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setLocalError(null);
    setUploadPreviews((current) => {
      if (current[field]?.url) {
        URL.revokeObjectURL(current[field].url);
      }

      if (!file) {
        return { ...current, [field]: null };
      }

      return {
        ...current,
        [field]: {
          name: file.name,
          url: URL.createObjectURL(file),
        },
      };
    });
  }

  function stepError(stepId: string) {
    let error: string | null = null;
    if (stepId === 'brand' && localizedCategories.length > 0 && !form.categories.length) return labels.validation.categoriesRequired;
    if (stepId === 'brand' && form.categories.length > 12) return language === 'es' ? 'Selecciona hasta 12 servicios.' : 'Choose up to 12 services.';
    if (stepId === 'media' && !logoInputRef.current?.files?.[0]) return labels.validation.logoRequired;
    if (stepId === 'media' && !heroInputRef.current?.files?.[0]) return labels.validation.heroRequired;
    if (stepId === 'contact' && !form.phone.trim() && !form.website_url.trim()) return labels.validation.contactRequired;
    if (stepId === 'contact' && !form.languages.length && !form.other_languages.trim()) error = labels.validation.languagesRequired;
    return error;
  }

  function validateCurrentStep() {
    const panel = formRef.current?.querySelector<HTMLElement>(`[data-step="${activeStep}"]`);
    const invalid = Array.from(panel?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea') ?? []).find(input => !input.checkValidity());
    if (invalid) {
      let parent = invalid.parentElement;
      while (parent && parent !== panel) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
        parent = parent.parentElement;
      }
      invalid.reportValidity();
      return false;
    }
    const error = stepError(activeStep);
    setLocalError(error);
    return !error;
  }

  function goNext() {
    if (validateCurrentStep()) changeStep(Math.min(step + 1, steps.length - 1));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (pending) { event.preventDefault(); return; }
    if (step < steps.length - 1) { event.preventDefault(); goNext(); return; }
    if (!validateCurrentStep()) { event.preventDefault(); return; }
    const incomplete = steps.findIndex(item => stepError(item.id));
    if (incomplete >= 0) {
      event.preventDefault();
      changeStep(incomplete);
      setLocalError(stepError(steps[incomplete].id));
      return;
    }
    // Keep previous panels mounted so text and selected files survive navigation.
    const invalid = Array.from(event.currentTarget.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea')).find(input => !input.checkValidity());
    if (invalid) {
      event.preventDefault();
      const id = invalid.closest<HTMLElement>('[data-step]')?.dataset.step;
      const index = steps.findIndex(item => item.id === id);
      if (index >= 0) changeStep(index);
      requestAnimationFrame(() => {
        let parent = invalid.parentElement;
        while (parent && parent !== formRef.current) {
          if (parent instanceof HTMLDetailsElement) parent.open = true;
          parent = parent.parentElement;
        }
        invalid.reportValidity();
      });
    }
  }

  const selectedCategoryLabels =
    localizedCategories
      .filter((item) => form.categories.includes(item.key))
      .map((item) => item.label)
      .join(', ') || labels.summary.pending;

  const selectedLanguages =
    [
      ...form.languages.map((value) => languageLabels[value]),
      ...form.other_languages
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ].join(', ') || labels.summary.pending;

  const selectedSeasons =
    form.peak_seasons.map((value) => seasonLabels[value]).join(', ') || labels.summary.pending;
  const selectedLogo = uploadPreviews.logo?.name || labels.summary.pending;
  const selectedHero = uploadPreviews.hero?.name || labels.summary.pending;
  const actionMessage = state.ok ? undefined : state.message;

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit} noValidate className="wm-onboarding-card wm-vendor-onboarding__form" aria-busy={pending}>
      <div className="wm-onboarding-card__header">
        <div>
          <p className="wm-onboarding-card__eyebrow">
            {labels.progressLabel} {step + 1} / {steps.length}
          </p>
          <h2 ref={headingRef} tabIndex={-1} className="wm-onboarding-card__title">{steps[step].title}</h2>
          <p className="wm-onboarding-card__description">{steps[step].description}</p>
        </div>
        <div className="wm-onboarding-meter" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <nav className="wm-onboarding-stepper" aria-label={labels.progressLabel}>
        {steps.map((item, index) => (
          <button
            key={item.title}
            type="button"
            className={`wm-onboarding-stepper__item${index === step ? ' is-active' : ''}${index < step ? ' is-complete' : ''}`}
            disabled={pending || index > furthestStep}
            aria-current={index === step ? 'step' : undefined}
            onClick={() => changeStep(index)}
          >
            <span className="wm-onboarding-stepper__index">{index + 1}</span>
            <span>{item.shortLabel}</span>
          </button>
        ))}
      </nav>
      <p className="wm-vendor-onboarding__required">{copy.required}</p>

      <section hidden={activeStep !== 'account'} data-step="account" className="wm-onboarding-panel">
        <div className="row g-4">
          {requiresAccount ? (
            <>
              <div className="col-12">
                <label className="form-label" htmlFor="vendor-owner-name">
                  {labels.fields.ownerNameLabel} <span aria-hidden="true">*</span>
                </label>
                <input
                  id="vendor-owner-name"
                  className="form-control"
                  name="owner_name"
                  value={form.owner_name}
                  onChange={(event) => updateField('owner_name', event.target.value)}
                  autoComplete="name"
                  required={requiresAccount}
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor="vendor-owner-email">
                  {signupLabels.emailLabel} <span aria-hidden="true">*</span>
                </label>
                <input
                  id="vendor-owner-email"
                  className="form-control"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  autoComplete="email"
                  required={requiresAccount}
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor="vendor-owner-password">
                  {signupLabels.passwordLabel} <span aria-hidden="true">*</span>
                </label>
                <PasswordInput
                  id="vendor-owner-password"
                  className="form-control"
                  name="password"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required={requiresAccount}
                />
                <div className="form-text">{language === 'es' ? 'Al menos 8 caracteres.' : 'At least 8 characters.'}</div>
              </div>
            </>
          ) : null}
        </div>
      </section>
      <section hidden={activeStep !== 'brand'} data-step="brand" className="wm-onboarding-panel">
        <div className="row g-4">
          <div className="col-12">
            <label className="form-label" htmlFor="vendor-business-name">
              {labels.businessNameLabel} <span aria-hidden="true">*</span>
            </label>
            <input
              id="vendor-business-name"
              className="form-control form-control-lg"
              minLength={2}
              maxLength={120}
              name="business_name"
              value={form.business_name}
              onChange={(event) => updateField('business_name', event.target.value)}
              required
            />
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor="vendor-tagline">
              {labels.fields.taglineLabel} <span aria-hidden="true">*</span>
            </label>
            <textarea
              id="vendor-tagline"
              className="form-control"
              name="tagline"
              minLength={12}
              maxLength={320}
              rows={3}
              value={form.tagline}
              onChange={(event) => updateField('tagline', event.target.value)}
              placeholder={labels.fields.taglinePlaceholder}
              required
            />
          </div>
        </div>

        <div className="wm-onboarding-fieldset mt-4">
          <label className="form-label" htmlFor="vendor-category-search">
            {labels.fields.categorySearchLabel}
          </label>
          <input
            id="vendor-category-search"
            className="form-control"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={labels.fields.categorySearchPlaceholder}
          />
          <p className="wm-onboarding-fieldset__hint">{labels.hints.categories}</p>

          <div className="wm-onboarding-selected mt-3">
            <strong>{dashboard.categories.selectedServices}</strong>
            <span>{selectedCategoryLabels}</span>
          </div>

          <div className="wm-onboarding-chip-grid wm-vendor-onboarding__services mt-3">
            {visibleCategories.length === 0 && <p>{copy.noMatches}</p>}
            {visibleCategories.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`wm-onboarding-chip${form.categories.includes(item.key) ? ' is-active' : ''}`}
                aria-pressed={form.categories.includes(item.key)}
                onClick={() => toggleArrayValue('categories', item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

      </section>
      <section hidden={activeStep !== 'media'} data-step="media" className="wm-onboarding-panel">
        <div className="wm-onboarding-fieldset">
          <div className="wm-onboarding-upload-grid">
            <div className="wm-onboarding-upload-field">
              <label className="wm-onboarding-upload-card" htmlFor="vendor-logo-file">
                <span className="wm-onboarding-upload-card__preview">
                  {uploadPreviews.logo ? (
                    <Image
                      src={uploadPreviews.logo.url}
                      alt={labels.fields.logoPreviewAlt}
                      width={1200}
                      height={750}
                      unoptimized
                    />
                  ) : (
                    <span className="wm-onboarding-upload-card__placeholder">{labels.fields.logoPlaceholder}</span>
                  )}
                </span>
                <span className="wm-onboarding-upload-card__body">
                  <span className="wm-onboarding-upload-card__eyebrow">{labels.fields.logoLabel}</span>
                  <strong className="wm-onboarding-upload-card__title">{labels.fields.logoTitle} <span aria-hidden="true">*</span></strong>
                  <span className="wm-onboarding-upload-card__copy">{labels.fields.logoHelp}</span>
                  <span className="wm-onboarding-upload-card__meta">
                    {uploadPreviews.logo?.name ?? labels.fields.logoEmpty}
                  </span>
                  <span className="wm-onboarding-upload-card__cta">
                    {uploadPreviews.logo ? labels.fields.replaceUploadCta : labels.fields.uploadCta}
                  </span>
                </span>
              </label>
              <input
                id="vendor-logo-file"
                ref={logoInputRef}
                className="wm-onboarding-upload-input"
                type="file"
                name="logo_file"
                accept="image/*"
                required
                onChange={(event) => updateUploadPreview('logo', event)}
              />
            </div>

            <div className="wm-onboarding-upload-field">
              <label className="wm-onboarding-upload-card" htmlFor="vendor-hero-file">
                <span className="wm-onboarding-upload-card__preview">
                  {uploadPreviews.hero ? (
                    <Image
                      src={uploadPreviews.hero.url}
                      alt={labels.fields.heroPreviewAlt}
                      width={1200}
                      height={750}
                      unoptimized
                    />
                  ) : (
                    <span className="wm-onboarding-upload-card__placeholder">{labels.fields.heroPlaceholder}</span>
                  )}
                </span>
                <span className="wm-onboarding-upload-card__body">
                  <span className="wm-onboarding-upload-card__eyebrow">{labels.fields.heroLabel}</span>
                  <strong className="wm-onboarding-upload-card__title">{labels.fields.heroTitle} <span aria-hidden="true">*</span></strong>
                  <span className="wm-onboarding-upload-card__copy">{labels.fields.heroHelp}</span>
                  <span className="wm-onboarding-upload-card__meta">
                    {uploadPreviews.hero?.name ?? labels.fields.heroEmpty}
                  </span>
                  <span className="wm-onboarding-upload-card__cta">
                    {uploadPreviews.hero ? labels.fields.replaceUploadCta : labels.fields.uploadCta}
                  </span>
                </span>
              </label>
              <input
                id="vendor-hero-file"
                ref={heroInputRef}
                className="wm-onboarding-upload-input"
                type="file"
                name="hero_file"
                accept="image/*"
                required
                onChange={(event) => updateUploadPreview('hero', event)}
              />
            </div>
          </div>
        </div>


      </section>

      <section hidden={activeStep !== 'coverage'} data-step="coverage" className="wm-onboarding-panel">
        <div className="row g-4">
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="vendor-city">
              {labels.cityLabel}
            </label>
            <input
              id="vendor-city"
              className="form-control"
              name="city"
              value={form.city}
              onChange={(event) => updateField('city', event.target.value)}
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="vendor-state">
              {dashboard.location.form.stateLabel}
            </label>
            <input
              id="vendor-state"
              className="form-control"
              name="state"
              value={form.state}
              onChange={(event) => updateField('state', event.target.value)}
            />
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor="vendor-country">
              {labels.countryLabel} <span aria-hidden="true">*</span>
            </label>
            <select
              id="vendor-country"
              className="form-select"
              name="country"
              value={form.country}
              onChange={(event) => updateField('country', event.target.value)}
              required
            >
              <option value="">{labels.countryPlaceholder}</option>
              {countryOptions.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor="vendor-style">
              {labels.fields.serviceStyleLabel}
            </label>
            <input
              id="vendor-style"
              className="form-control"
              name="service_style"
              value={form.service_style}
              onChange={(event) => updateField('service_style', event.target.value)}
              placeholder={labels.fields.serviceStylePlaceholder}
            />
          </div>
        </div>

        <details className="wm-editorial-details"><summary>{copy.optional}</summary>
        <div className="wm-onboarding-fieldset mt-4">
          <label className="form-label" htmlFor="vendor-radius">
            {dashboard.location.form.radiusLabel}
          </label>
          <div className="wm-onboarding-range">
            <input
              id="vendor-radius"
              className="form-range"
              type="range"
              min={10}
              max={500}
              step={10}
              name="service_radius_km"
              value={form.service_radius_km}
              onChange={(event) => updateField('service_radius_km', event.target.value)}
            />
            <span>{form.service_radius_km} km</span>
          </div>
        </div>

        <div className="wm-onboarding-fieldset mt-4">
          <label className="form-label">{dashboard.profileContact.eventTypesLabel}</label>
          <p className="wm-onboarding-fieldset__hint">{labels.hints.eventTypes}</p>
          <div className="wm-onboarding-chip-grid">
            {eventTypeOptions.map((value) => (
              <button
                key={value}
                type="button"
                className={`wm-onboarding-chip${form.event_types.includes(value) ? ' is-active' : ''}`}
                aria-pressed={form.event_types.includes(value)}
                onClick={() => toggleArrayValue('event_types', value)}
              >
                {eventTypeLabels[value]}
              </button>
            ))}
          </div>
        </div>
        </details>
      </section>

      <section hidden={activeStep !== 'contact'} data-step="contact" className="wm-onboarding-panel">
        <div className="row g-4">
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="vendor-phone">
              {dashboard.profileContact.phoneLabel}
            </label>
            <input
              id="vendor-phone"
              className="form-control"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              autoComplete="tel"
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="vendor-website">
              {dashboard.profileContact.websiteLabel}
            </label>
            <input
              id="vendor-website"
              className="form-control"
              name="website_url"
              value={form.website_url}
              onChange={(event) => updateField('website_url', event.target.value)}
              placeholder="yourstudio.com"
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="vendor-other-languages">
              {labels.fields.otherLanguagesLabel}
            </label>
            <input
              id="vendor-other-languages"
              className="form-control"
              name="other_languages"
              value={form.other_languages}
              onChange={(event) => updateField('other_languages', event.target.value)}
              placeholder={labels.fields.otherLanguagesPlaceholder}
            />
          </div>
        </div>

        <details className="wm-editorial-details"><summary>{copy.optional}</summary><div className="row g-4">
          <div className="col-12">
            <label className="form-label" htmlFor="vendor-address">
              {dashboard.profileContact.addressLabel}
            </label>
            <input
              id="vendor-address"
              className="form-control"
              name="address_label"
              value={form.address_label}
              onChange={(event) => updateField('address_label', event.target.value)}
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="vendor-instagram">
              {labels.fields.instagramLabel}
            </label>
            <input
              id="vendor-instagram"
              className="form-control"
              name="instagram_handle"
              value={form.instagram_handle}
              onChange={(event) => updateField('instagram_handle', event.target.value)}
              placeholder={labels.fields.instagramPlaceholder}
            />
          </div>
        </div></details>
        <div className="wm-onboarding-fieldset mt-4">
          <label className="form-label">{dashboard.profileContact.languagesLabel}</label>
          <p className="wm-onboarding-fieldset__hint">{labels.hints.languages}</p>
          <div className="wm-onboarding-chip-grid">
            {languageOptions.map((value) => (
              <button
                key={value}
                type="button"
                className={`wm-onboarding-chip${form.languages.includes(value) ? ' is-active' : ''}`}
                aria-pressed={form.languages.includes(value)}
                onClick={() => toggleArrayValue('languages', value)}
              >
                {languageLabels[value]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section hidden={activeStep !== 'pricing'} data-step="pricing" className="wm-onboarding-panel">
        <div className="row g-4">
          <div className="col-12 col-md-4">
            <label className="form-label" htmlFor="vendor-years">
              {dashboard.profileContact.yearsInBusinessLabel}
            </label>
            <input
              id="vendor-years"
              className="form-control"
              type="number"
              min={0}
              name="years_in_business"
              value={form.years_in_business}
              onChange={(event) => updateField('years_in_business', event.target.value)}
            />
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label" htmlFor="vendor-starting-price">
              {dashboard.profileContact.startingPriceLabel} <span aria-hidden="true">*</span>
            </label>
            <input
              id="vendor-starting-price"
              className="form-control"
              type="number"
              min={0}
              step="0.01"
              name="starting_price"
              value={form.starting_price}
              onChange={(event) => updateField('starting_price', event.target.value)}
              required
            />
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label" htmlFor="vendor-currency">
              {dashboard.profileContact.startingCurrencyLabel}
            </label>
            <input
              id="vendor-currency"
              className="form-control"
              name="starting_price_currency"
              value={form.starting_price_currency}
              onChange={(event) => updateField('starting_price_currency', event.target.value.toUpperCase())}
              maxLength={3}
            />
          </div>
        </div>
        <details className="wm-editorial-details"><summary>{copy.optional}</summary>
        <div className="row g-4">
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="vendor-typical-spend">
              {dashboard.profilePricing.typicalSpendLabel}
            </label>
            <input
              id="vendor-typical-spend"
              className="form-control"
              type="number"
              min={0}
              step="0.01"
              name="typical_spend"
              value={form.typical_spend}
              onChange={(event) => updateField('typical_spend', event.target.value)}
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">{dashboard.profileContact.teamSizeLabel}</label>
            <div className="wm-onboarding-chip-grid">
              {teamSizeOptions.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`wm-onboarding-chip${form.team_size_range === value ? ' is-active' : ''}`}
                  aria-pressed={form.team_size_range === value}
                  onClick={() => updateField('team_size_range', value)}
                >
                  {teamSizeLabels[value]}
                </button>
              ))}
            </div>
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor="vendor-booking-lead-time">
              {labels.fields.bookingLeadTimeLabel}
            </label>
            <input
              id="vendor-booking-lead-time"
              className="form-control"
              name="booking_lead_time"
              value={form.booking_lead_time}
              onChange={(event) => updateField('booking_lead_time', event.target.value)}
              placeholder={labels.fields.bookingLeadTimePlaceholder}
            />
          </div>
        </div>

        <div className="wm-onboarding-fieldset mt-4">
          <label className="form-label">{dashboard.profilePricing.peakSeasonsLabel}</label>
          <p className="wm-onboarding-fieldset__hint">{labels.hints.pricing}</p>
          <div className="wm-onboarding-chip-grid">
            {peakSeasonOptions.map((value) => (
              <button
                key={value}
                type="button"
                className={`wm-onboarding-chip${form.peak_seasons.includes(value) ? ' is-active' : ''}`}
                aria-pressed={form.peak_seasons.includes(value)}
                onClick={() => toggleArrayValue('peak_seasons', value)}
              >
                {seasonLabels[value]}
              </button>
            ))}
          </div>
        </div>

        </details>
        <details className="wm-editorial-details"><summary>{copy.review}</summary><dl className="wm-onboarding-summary mt-4">
          <SummaryRow label={labels.summary.businessLabel} value={form.business_name || labels.summary.pending} />
          <SummaryRow label={labels.summary.logoLabel} value={selectedLogo} />
          <SummaryRow label={labels.summary.heroLabel} value={selectedHero} />
          <SummaryRow label={labels.summary.categoriesLabel} value={selectedCategoryLabels} />
          <SummaryRow
            label={labels.summary.coverageLabel}
            value={[form.city, form.state, form.country].filter(Boolean).join(', ') || labels.summary.pending}
          />
          <SummaryRow label={labels.summary.contactLabel} value={form.website_url || form.phone || labels.summary.pending} />
          <SummaryRow label={labels.summary.languagesLabel} value={selectedLanguages} />
          <SummaryRow
            label={labels.summary.pricingLabel}
            value={
              [form.starting_price ? `${form.starting_price_currency} ${form.starting_price}` : '', selectedSeasons]
                .filter((value) => value && value !== labels.summary.pending)
                .join(' - ') || labels.summary.pending
            }
          />
        </dl></details>

        <div className="wm-onboarding-note">
          <strong>{labels.finishCard.title}</strong>
          <p>{labels.finishCard.description}</p>
        </div>
      </section>

      <input type="hidden" name="team_size_range" value={form.team_size_range} />
      {form.categories.map((value) => (
        <input key={value} type="hidden" name="categories" value={value} />
      ))}
      {form.event_types.map((value) => (
        <input key={value} type="hidden" name="event_types" value={value} />
      ))}
      {form.languages.map((value) => (
        <input key={value} type="hidden" name="languages" value={value} />
      ))}
      {form.peak_seasons.map((value) => (
        <input key={value} type="hidden" name="peak_seasons" value={value} />
      ))}
      <input type="hidden" name="account_language" value={language} />

      {(localError || actionMessage) && (
        <div role="alert" className="alert alert-danger mt-3">{localError ?? actionMessage}</div>
      )}

      <div className="wm-onboarding-actions">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => {
            changeStep(Math.max(step - 1, 0));
          }}
          hidden={step === 0}
          disabled={pending}
        >
          {labels.actions.back}
        </button>

        {step < steps.length - 1 ? (
          <button type="button" className="btn btn-primary" disabled={pending} onClick={goNext}>
            {labels.actions.next}
          </button>
        ) : (
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? labels.submitting : labels.submit}
          </button>
        )}
      </div>
    </form>
  );
}

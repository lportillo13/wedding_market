'use client';

import Image from 'next/image';
import { type ChangeEvent, useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { buildCountryOptions } from '@/lib/countries';
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
    labels.steps.brand,
    labels.steps.coverage,
    labels.steps.contact,
    labels.steps.pricing,
  ];
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

  function validateCurrentStep() {
    if (step === 0) {
      if (requiresAccount) {
        if (!form.owner_name.trim()) return labels.validation.ownerNameRequired;
        if (!form.email.trim()) return labels.validation.emailRequired;
        if (!form.password.trim()) return labels.validation.passwordRequired;
        if (form.password.trim().length < 6) return labels.validation.passwordTooShort;
      }
      if (!form.business_name.trim()) return labels.validation.businessNameRequired;
      if (!form.tagline.trim()) return labels.validation.taglineRequired;
      if (!logoInputRef.current?.files?.[0]) return labels.validation.logoRequired;
      if (!heroInputRef.current?.files?.[0]) return labels.validation.heroRequired;
      if (localizedCategories.length > 0 && !form.categories.length) {
        return labels.validation.categoriesRequired;
      }
      return null;
    }

    if (step === 1) {
      if (!form.country.trim()) return labels.validation.countryRequired;
      return null;
    }

    if (step === 2) {
      if (!form.phone.trim() && !form.website_url.trim()) return labels.validation.contactRequired;
      if (!form.languages.length && !form.other_languages.trim()) return labels.validation.languagesRequired;
      return null;
    }

    if (step === 3) {
      if (!form.starting_price.trim()) return labels.validation.startingPriceRequired;
      return null;
    }

    return null;
  }

  function goNext() {
    const error = validateCurrentStep();
    if (error) {
      setLocalError(error);
      return;
    }

    setLocalError(null);
    setStep((current) => Math.min(current + 1, steps.length - 1));
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
    <form action={action} className="wm-onboarding-card" encType="multipart/form-data">
      <div className="wm-onboarding-card__header">
        <div>
          <p className="wm-onboarding-card__eyebrow">
            {labels.progressLabel} {step + 1} / {steps.length}
          </p>
          <h2 className="wm-onboarding-card__title">{steps[step].title}</h2>
          <p className="wm-onboarding-card__description">{steps[step].description}</p>
        </div>
        <div className="wm-onboarding-meter" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="wm-onboarding-stepper" aria-label={labels.progressLabel}>
        {steps.map((item, index) => (
          <button
            key={item.title}
            type="button"
            className={`wm-onboarding-stepper__item${index === step ? ' is-active' : ''}${index < step ? ' is-complete' : ''}`}
            onClick={() => {
              if (index <= step) {
                setLocalError(null);
                setStep(index);
              }
            }}
          >
            <span className="wm-onboarding-stepper__index">{index + 1}</span>
            <span>{item.shortLabel}</span>
          </button>
        ))}
      </div>

      <section hidden={step !== 0} className="wm-onboarding-panel">
        <div className="row g-3">
          {requiresAccount ? (
            <>
              <div className="col-12">
                <div className="wm-onboarding-question">
                  <span>{labels.accountPrompt.title}</span>
                  <strong>{labels.accountPrompt.subtitle}</strong>
                </div>
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="vendor-owner-name">
                  {labels.fields.ownerNameLabel}
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
                  {signupLabels.emailLabel}
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
                  {signupLabels.passwordLabel}
                </label>
                <input
                  id="vendor-owner-password"
                  className="form-control"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required={requiresAccount}
                />
                <div className="form-text">{signupLabels.passwordHelp}</div>
              </div>
            </>
          ) : null}
          <div className="col-12">
            <label className="form-label" htmlFor="vendor-business-name">
              {labels.businessNameLabel}
            </label>
            <input
              id="vendor-business-name"
              className="form-control form-control-lg"
              name="business_name"
              value={form.business_name}
              onChange={(event) => updateField('business_name', event.target.value)}
              required
            />
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor="vendor-tagline">
              {labels.fields.taglineLabel}
            </label>
            <textarea
              id="vendor-tagline"
              className="form-control"
              name="tagline"
              rows={3}
              value={form.tagline}
              onChange={(event) => updateField('tagline', event.target.value)}
              placeholder={labels.fields.taglinePlaceholder}
              required
            />
          </div>
        </div>

        <div className="wm-onboarding-fieldset mt-4">
          <div className="wm-onboarding-question">
            <span>{labels.fields.mediaPromptLabel}</span>
            <strong>{labels.fields.mediaPromptTitle}</strong>
          </div>
          <p className="wm-onboarding-fieldset__hint">{labels.hints.media}</p>

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
                  <strong className="wm-onboarding-upload-card__title">{labels.fields.logoTitle}</strong>
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
                  <strong className="wm-onboarding-upload-card__title">{labels.fields.heroTitle}</strong>
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

          <div className="wm-onboarding-chip-grid mt-3">
            {visibleCategories.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`wm-onboarding-chip${form.categories.includes(item.key) ? ' is-active' : ''}`}
                onClick={() => toggleArrayValue('categories', item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section hidden={step !== 1} className="wm-onboarding-panel">
        <div className="row g-3">
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
              {labels.countryLabel}
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
                onClick={() => toggleArrayValue('event_types', value)}
              >
                {eventTypeLabels[value]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section hidden={step !== 2} className="wm-onboarding-panel">
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="vendor-phone">
              {dashboard.profileContact.phoneLabel}
            </label>
            <input
              id="vendor-phone"
              className="form-control"
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

        <div className="wm-onboarding-fieldset mt-4">
          <label className="form-label">{dashboard.profileContact.languagesLabel}</label>
          <p className="wm-onboarding-fieldset__hint">{labels.hints.languages}</p>
          <div className="wm-onboarding-chip-grid">
            {languageOptions.map((value) => (
              <button
                key={value}
                type="button"
                className={`wm-onboarding-chip${form.languages.includes(value) ? ' is-active' : ''}`}
                onClick={() => toggleArrayValue('languages', value)}
              >
                {languageLabels[value]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section hidden={step !== 3} className="wm-onboarding-panel">
        <div className="row g-3">
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
              {dashboard.profileContact.startingPriceLabel}
            </label>
            <input
              id="vendor-starting-price"
              className="form-control"
              type="number"
              min={0}
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
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="vendor-typical-spend">
              {dashboard.profilePricing.typicalSpendLabel}
            </label>
            <input
              id="vendor-typical-spend"
              className="form-control"
              type="number"
              min={0}
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
                onClick={() => toggleArrayValue('peak_seasons', value)}
              >
                {seasonLabels[value]}
              </button>
            ))}
          </div>
        </div>

        <div className="wm-onboarding-summary mt-4">
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
        </div>

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
        <div className="alert alert-danger mt-3">{localError ?? actionMessage}</div>
      )}

      <div className="wm-onboarding-actions">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => {
            setLocalError(null);
            setStep((current) => Math.max(current - 1, 0));
          }}
          disabled={step === 0 || pending}
        >
          {labels.actions.back}
        </button>

        {step < steps.length - 1 ? (
          <button type="button" className="btn btn-primary" onClick={goNext}>
            {labels.actions.next}
          </button>
        ) : (
          <button className="btn btn-primary" disabled={pending}>
            {pending ? labels.submitting : labels.submit}
          </button>
        )}
      </div>
    </form>
  );
}

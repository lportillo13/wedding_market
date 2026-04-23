'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { buildCountryOptions } from '@/lib/countries';
import { signUp, type SignUpState } from './actions';

const initialState: SignUpState = { ok: false };

const weddingThemeOptions = ['classic', 'boho', 'rustic', 'beach', 'garden', 'modern', 'vintage'] as const;
const planningStageOptions = ['just-starting', 'venue-booked', 'shortlisting', 'ready-to-book'] as const;
const priorityOptions = ['venue', 'photography', 'planner', 'beauty', 'decor', 'catering', 'music'] as const;

type WeddingThemeValue = (typeof weddingThemeOptions)[number];
type PlanningStageValue = (typeof planningStageOptions)[number];
type PriorityValue = (typeof priorityOptions)[number];

type FormShape = {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  tentative_wedding_date: string;
  guest_count: string;
  wedding_budget: string;
  celebration_city: string;
  celebration_region: string;
  country: string;
  wedding_theme: WeddingThemeValue | '';
  planning_stage: PlanningStageValue | '';
  language: 'en' | 'es';
  priority_services: PriorityValue[];
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="wm-onboarding-summary__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, initialState);
  const { dictionary, language, setLanguage } = useLanguage();
  const labels = dictionary.signup.form;
  const profileLabels = dictionary.account.profile.form;
  const [step, setStep] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [form, setForm] = useState<FormShape>(() => ({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    tentative_wedding_date: '',
    guest_count: '',
    wedding_budget: '',
    celebration_city: '',
    celebration_region: '',
    country: '',
    wedding_theme: '',
    planning_stage: '',
    language,
    priority_services: [],
  }));

  const steps = [
    labels.steps.account,
    labels.steps.wedding,
    labels.steps.style,
    labels.steps.finish,
  ];
  const countryOptions = useMemo(() => buildCountryOptions(form.country), [form.country]);
  const progress = ((step + 1) / steps.length) * 100;

  useEffect(() => {
    if (state.ok && state.redirectTo) {
      window.location.replace(state.redirectTo);
    }
  }, [state]);

  const themeLabels: Record<WeddingThemeValue, string> = {
    classic: profileLabels.weddingTheme.options.classic,
    boho: profileLabels.weddingTheme.options.boho,
    rustic: profileLabels.weddingTheme.options.rustic,
    beach: profileLabels.weddingTheme.options.beach,
    garden: profileLabels.weddingTheme.options.garden,
    modern: profileLabels.weddingTheme.options.modern,
    vintage: profileLabels.weddingTheme.options.vintage,
  };

  const planningLabels: Record<PlanningStageValue, string> = {
    'just-starting': labels.options.planningStage['just-starting'],
    'venue-booked': labels.options.planningStage['venue-booked'],
    shortlisting: labels.options.planningStage.shortlisting,
    'ready-to-book': labels.options.planningStage['ready-to-book'],
  };

  const priorityLabels: Record<PriorityValue, string> = {
    venue: labels.options.priorities.venue,
    photography: labels.options.priorities.photography,
    planner: labels.options.priorities.planner,
    beauty: labels.options.priorities.beauty,
    decor: labels.options.priorities.decor,
    catering: labels.options.priorities.catering,
    music: labels.options.priorities.music,
  };

  function updateField(name: keyof FormShape, value: string) {
    setLocalError(null);
    setForm((current) => ({ ...current, [name]: value }));
  }

  function togglePriority(value: PriorityValue) {
    setLocalError(null);
    setForm((current) => ({
      ...current,
      priority_services: current.priority_services.includes(value)
        ? current.priority_services.filter((item) => item !== value)
        : [...current.priority_services, value],
    }));
  }

  function validateCurrentStep() {
    if (step === 0) {
      if (!form.full_name.trim()) return labels.validation.fullNameRequired;
      if (!form.email.trim()) return labels.validation.emailRequired;
      if (!form.password.trim()) return labels.validation.passwordRequired;
      if (form.password.trim().length < 6) return labels.validation.passwordTooShort;
      return null;
    }

    if (step === 1) {
      if (!form.tentative_wedding_date) return labels.validation.dateRequired;
      if (!form.guest_count.trim()) return labels.validation.guestCountRequired;
      if (!form.wedding_budget.trim()) return labels.validation.budgetRequired;
      if (!form.country.trim()) return labels.validation.countryRequired;
      return null;
    }

    if (step === 2) {
      if (!form.planning_stage) return labels.validation.planningStageRequired;
      if (!form.priority_services.length) return labels.validation.prioritiesRequired;
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

  const summaryValues = {
    location:
      [form.celebration_city, form.celebration_region, form.country].filter(Boolean).join(', ') ||
      labels.summary.pending,
    priorities:
      form.priority_services.map((value) => priorityLabels[value]).join(', ') || labels.summary.pending,
    stage: form.planning_stage ? planningLabels[form.planning_stage] : labels.summary.pending,
    theme: form.wedding_theme ? themeLabels[form.wedding_theme] : labels.summary.pending,
    language:
      form.language === 'es'
        ? dictionary.languageSelector.spanish
        : dictionary.languageSelector.english,
  };
  const actionMessage = state.ok ? undefined : state.message;

  return (
    <form action={action} className="wm-onboarding-card">
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
          <div className="col-12">
            <label className="form-label" htmlFor="signup-full-name">
              {labels.fields.fullNameLabel}
            </label>
            <input
              id="signup-full-name"
              className="form-control form-control-lg"
              name="full_name"
              value={form.full_name}
              onChange={(event) => updateField('full_name', event.target.value)}
              autoComplete="name"
              required
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="signup-email">
              {labels.emailLabel}
            </label>
            <input
              id="signup-email"
              className="form-control"
              type="email"
              name="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="signup-password">
              {labels.passwordLabel}
            </label>
            <input
              id="signup-password"
              className="form-control"
              type="password"
              name="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
            <div className="form-text">{labels.passwordHelp}</div>
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor="signup-phone">
              {labels.fields.phoneLabel}
            </label>
            <input
              id="signup-phone"
              className="form-control"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              autoComplete="tel"
              placeholder={labels.fields.phonePlaceholder}
            />
          </div>
        </div>
      </section>

      <section hidden={step !== 1} className="wm-onboarding-panel">
        <div className="wm-onboarding-question">
          <span>{labels.prompts.when.title}</span>
          <strong>{labels.prompts.when.subtitle}</strong>
        </div>
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="signup-date">
              {profileLabels.tentativeWeddingDateLabel}
            </label>
            <input
              id="signup-date"
              className="form-control"
              type="date"
              name="tentative_wedding_date"
              value={form.tentative_wedding_date}
              onChange={(event) => updateField('tentative_wedding_date', event.target.value)}
              required
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="signup-guests">
              {profileLabels.guestCountLabel}
            </label>
            <input
              id="signup-guests"
              className="form-control"
              type="number"
              min={1}
              name="guest_count"
              value={form.guest_count}
              onChange={(event) => updateField('guest_count', event.target.value)}
              required
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="signup-budget">
              {profileLabels.budgetLabel}
            </label>
            <input
              id="signup-budget"
              className="form-control"
              type="number"
              min={0}
              step="0.01"
              name="wedding_budget"
              value={form.wedding_budget}
              onChange={(event) => updateField('wedding_budget', event.target.value)}
              required
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="signup-country">
              {profileLabels.countryLabel}
            </label>
            <select
              id="signup-country"
              className="form-select"
              name="country"
              value={form.country}
              onChange={(event) => updateField('country', event.target.value)}
              autoComplete="country-name"
              required
            >
              <option value="">{profileLabels.countryPlaceholder}</option>
              {countryOptions.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="signup-city">
              {labels.fields.cityLabel}
            </label>
            <input
              id="signup-city"
              className="form-control"
              name="celebration_city"
              value={form.celebration_city}
              onChange={(event) => updateField('celebration_city', event.target.value)}
              placeholder={labels.fields.cityPlaceholder}
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="signup-region">
              {labels.fields.regionLabel}
            </label>
            <input
              id="signup-region"
              className="form-control"
              name="celebration_region"
              value={form.celebration_region}
              onChange={(event) => updateField('celebration_region', event.target.value)}
              placeholder={labels.fields.regionPlaceholder}
            />
          </div>
        </div>
      </section>

      <section hidden={step !== 2} className="wm-onboarding-panel">
        <div className="wm-onboarding-question">
          <span>{labels.prompts.style.title}</span>
          <strong>{labels.prompts.style.subtitle}</strong>
        </div>

        <div className="wm-onboarding-fieldset">
          <label className="form-label">{profileLabels.weddingThemeLabel}</label>
          <div className="wm-onboarding-chip-grid">
            <button
              type="button"
              className={`wm-onboarding-chip${form.wedding_theme === '' ? ' is-active' : ''}`}
              onClick={() => updateField('wedding_theme', '')}
            >
              {profileLabels.weddingTheme.options.none}
            </button>
            {weddingThemeOptions.map((value) => (
              <button
                key={value}
                type="button"
                className={`wm-onboarding-chip${form.wedding_theme === value ? ' is-active' : ''}`}
                onClick={() => updateField('wedding_theme', value)}
              >
                {themeLabels[value]}
              </button>
            ))}
          </div>
        </div>

        <div className="wm-onboarding-fieldset">
          <label className="form-label">{labels.fields.planningStageLabel}</label>
          <div className="wm-onboarding-choice-grid">
            {planningStageOptions.map((value) => (
              <button
                key={value}
                type="button"
                className={`wm-onboarding-choice${form.planning_stage === value ? ' is-active' : ''}`}
                onClick={() => updateField('planning_stage', value)}
              >
                <strong>{planningLabels[value]}</strong>
                <span>{labels.hints.planningStage[value]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="wm-onboarding-fieldset">
          <label className="form-label">{labels.fields.prioritiesLabel}</label>
          <p className="wm-onboarding-fieldset__hint">{labels.hints.priorities}</p>
          <div className="wm-onboarding-chip-grid">
            {priorityOptions.map((value) => (
              <button
                key={value}
                type="button"
                className={`wm-onboarding-chip${form.priority_services.includes(value) ? ' is-active' : ''}`}
                onClick={() => togglePriority(value)}
              >
                {priorityLabels[value]}
              </button>
            ))}
          </div>
        </div>

        <div className="wm-onboarding-fieldset">
          <label className="form-label">{profileLabels.preferredLanguageLabel}</label>
          <div className="wm-onboarding-chip-grid">
            <button
              type="button"
              className={`wm-onboarding-chip${form.language === 'en' ? ' is-active' : ''}`}
              onClick={() => {
                setLanguage('en');
                updateField('language', 'en');
              }}
            >
              {dictionary.languageSelector.english}
            </button>
            <button
              type="button"
              className={`wm-onboarding-chip${form.language === 'es' ? ' is-active' : ''}`}
              onClick={() => {
                setLanguage('es');
                updateField('language', 'es');
              }}
            >
              {dictionary.languageSelector.spanish}
            </button>
          </div>
          <p className="wm-onboarding-fieldset__hint">{profileLabels.preferredLanguageHelp}</p>
        </div>
      </section>

      <section hidden={step !== 3} className="wm-onboarding-panel">
        <div className="wm-onboarding-question">
          <span>{labels.prompts.finish.title}</span>
          <strong>{labels.prompts.finish.subtitle}</strong>
        </div>

        <div className="wm-onboarding-summary">
          <SummaryRow label={labels.summary.nameLabel} value={form.full_name || labels.summary.pending} />
          <SummaryRow label={labels.summary.dateLabel} value={form.tentative_wedding_date || labels.summary.pending} />
          <SummaryRow label={labels.summary.locationLabel} value={summaryValues.location} />
          <SummaryRow label={labels.summary.guestCountLabel} value={form.guest_count || labels.summary.pending} />
          <SummaryRow label={labels.summary.budgetLabel} value={form.wedding_budget || labels.summary.pending} />
          <SummaryRow label={labels.summary.stageLabel} value={summaryValues.stage} />
          <SummaryRow label={labels.summary.themeLabel} value={summaryValues.theme} />
          <SummaryRow label={labels.summary.prioritiesLabel} value={summaryValues.priorities} />
          <SummaryRow label={labels.summary.languageLabel} value={summaryValues.language} />
        </div>

        <div className="wm-onboarding-note">
          <strong>{labels.finishCard.title}</strong>
          <p>{labels.finishCard.description}</p>
        </div>
      </section>

      <input type="hidden" name="wedding_theme" value={form.wedding_theme} />
      <input type="hidden" name="planning_stage" value={form.planning_stage} />
      <input type="hidden" name="language" value={form.language} />
      {form.priority_services.map((value) => (
        <input key={value} type="hidden" name="priority_services" value={value} />
      ))}

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

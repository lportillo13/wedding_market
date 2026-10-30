"use client";

import { useActionState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { isSupportedLanguage, type SupportedLanguage } from "@/lib/i18n";
import { saveProfile, type SaveProfileState } from "./actions";
import { buildCountryOptions } from "@/lib/countries";

const initialState: SaveProfileState = { ok: false, message: "" };

export type ProfileFormInitial = {
  full_name: string;
  phone: string;
  email: string;
  country: string;
  tentative_wedding_date: string;
  guest_count: number | null;
  wedding_budget: number | null;
  wedding_theme: string;
  language: SupportedLanguage;
};

export default function ProfileForm({ initial }: { initial: ProfileFormInitial }) {
  const [state, formAction, pending] = useActionState<SaveProfileState, FormData>(saveProfile, initialState);
  const { setLanguage, dictionary } = useLanguage();
  const formLabels = dictionary.account.profile.form;
  const editorial = dictionary.account.profile.editorial;

  const countryOptions = useMemo(
    () => buildCountryOptions(initial.country),
    [initial.country]
  );

  const languageOptions = useMemo(
    () => [
      { value: "en" as SupportedLanguage, label: dictionary.languageSelector.english },
      { value: "es" as SupportedLanguage, label: dictionary.languageSelector.spanish },
    ],
    [dictionary.languageSelector.english, dictionary.languageSelector.spanish]
  );

  const themeOptions = useMemo(
    () => [
      { value: "", label: formLabels.weddingTheme.options.none },
      { value: "classic", label: formLabels.weddingTheme.options.classic },
      { value: "boho", label: formLabels.weddingTheme.options.boho },
      { value: "rustic", label: formLabels.weddingTheme.options.rustic },
      { value: "beach", label: formLabels.weddingTheme.options.beach },
      { value: "garden", label: formLabels.weddingTheme.options.garden },
      { value: "modern", label: formLabels.weddingTheme.options.modern },
      { value: "vintage", label: formLabels.weddingTheme.options.vintage },
    ],
    [
      formLabels.weddingTheme.options.none,
      formLabels.weddingTheme.options.classic,
      formLabels.weddingTheme.options.boho,
      formLabels.weddingTheme.options.rustic,
      formLabels.weddingTheme.options.beach,
      formLabels.weddingTheme.options.garden,
      formLabels.weddingTheme.options.modern,
      formLabels.weddingTheme.options.vintage,
    ]
  );

  return (
    <form action={formAction} className="wm-personal-profile-form" aria-busy={pending}>
      <section className="wm-profile-section" aria-labelledby="profile-contact-heading">
        <div className="wm-profile-section__heading">
          <span aria-hidden="true">01</span>
          <h2 id="profile-contact-heading">{editorial.contactTitle}</h2>
          <p>{editorial.contactDescription}</p>
        </div>
        <div className="wm-profile-fields">
        <div>
          <label className="form-label" htmlFor="profile-name">
            {formLabels.fullNameLabel}
          </label>
          <input
            id="profile-name"
            name="full_name"
            type="text"
            className="form-control"
            defaultValue={initial.full_name}
            required
            autoComplete="name"
          />
          {state.fieldErrors?.full_name && <div className="text-danger small">{state.fieldErrors.full_name}</div>}
        </div>
        <div>
          <label className="form-label" htmlFor="profile-phone">
            {formLabels.phoneLabel}
          </label>
          <input
            id="profile-phone"
            name="phone"
            type="tel"
            className="form-control"
            defaultValue={initial.phone}
            autoComplete="tel"
          />
          {state.fieldErrors?.phone && <div className="text-danger small">{state.fieldErrors.phone}</div>}
        </div>
        <div>
          <label className="form-label" htmlFor="profile-email">
            {formLabels.emailLabel}
          </label>
          <input
            id="profile-email"
            type="email"
            className="form-control"
            value={initial.email}
            disabled
            readOnly
            aria-describedby="profile-email-help"
          />
          <div id="profile-email-help" className="form-text">{formLabels.emailHelp}</div>
        </div>
        <div>
          <label className="form-label" htmlFor="profile-country">
            {editorial.contactCountryLabel}
          </label>
          <select
            id="profile-country"
            name="country"
            className="form-select"
            defaultValue={initial.country}
            autoComplete="country-name"
          >
            <option value="">{formLabels.countryPlaceholder}</option>
            {countryOptions.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          {state.fieldErrors?.country && <div className="text-danger small">{state.fieldErrors.country}</div>}
        </div>
        <div>
          <label className="form-label" htmlFor="profile-language">
            {formLabels.preferredLanguageLabel}
          </label>
          <select
            id="profile-language"
            name="language"
            className="form-select"
            defaultValue={initial.language}
            onChange={(event) => {
              const value = event.target.value;
              if (isSupportedLanguage(value)) {
                setLanguage(value);
              }
            }}
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="form-text">{formLabels.preferredLanguageHelp}</div>
          {state.fieldErrors?.language && <div className="text-danger small">{state.fieldErrors.language}</div>}
        </div>
        </div>
      </section>

      <section className="wm-profile-section" aria-labelledby="profile-wedding-heading">
        <div className="wm-profile-section__heading">
          <span aria-hidden="true">02</span>
          <h2 id="profile-wedding-heading">{editorial.weddingTitle}</h2>
          <p>{editorial.weddingDescription}</p>
        </div>
        <div>
        <div className="wm-profile-fields">
        <div>
          <label className="form-label" htmlFor="profile-date">
            {formLabels.tentativeWeddingDateLabel}
          </label>
          <input
            id="profile-date"
            name="tentative_wedding_date"
            type="date"
            className="form-control"
            defaultValue={initial.tentative_wedding_date}
          />
          {state.fieldErrors?.tentative_wedding_date && (
            <div className="text-danger small">{state.fieldErrors.tentative_wedding_date}</div>
          )}
        </div>
        <div>
          <label className="form-label" htmlFor="profile-guests">
            {formLabels.guestCountLabel} <span className="wm-profile-optional">{editorial.optional}</span>
          </label>
          <input
            id="profile-guests"
            name="guest_count"
            type="number"
            min={1}
            className="form-control"
            defaultValue={initial.guest_count ?? ""}
          />
          {state.fieldErrors?.guest_count && <div className="text-danger small">{state.fieldErrors.guest_count}</div>}
        </div>
        <div>
          <label className="form-label" htmlFor="profile-budget">
            {formLabels.budgetLabel} <span className="wm-profile-optional">{editorial.optional}</span>
          </label>
          <input
            id="profile-budget"
            name="wedding_budget"
            type="number"
            min={0}
            step="0.01"
            className="form-control"
            defaultValue={initial.wedding_budget ?? ""}
          />
          {state.fieldErrors?.wedding_budget && <div className="text-danger small">{state.fieldErrors.wedding_budget}</div>}
        </div>
        <div>
          <label className="form-label" htmlFor="profile-theme">
            {formLabels.weddingThemeLabel}
          </label>
          <select
            id="profile-theme"
            name="wedding_theme"
            className="form-select"
            defaultValue={initial.wedding_theme}
          >
            {themeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {state.fieldErrors?.wedding_theme && <div className="text-danger small">{state.fieldErrors.wedding_theme}</div>}
        </div>
        </div>
        <p className="wm-profile-wedding-note">{editorial.weddingLocationNote}</p>
        </div>
      </section>

      {state.message && (
        <div className={`alert ${state.ok ? "alert-success" : "alert-danger"}`} role={state.ok ? "status" : "alert"}>{state.message}</div>
      )}

      <div className="wm-profile-save">
        <p>{editorial.saveNote}</p>
        <button type="submit" className="wm-profile-button" disabled={pending}>
          {pending ? formLabels.submit.saving : editorial.saveLabel}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
        </button>
      </div>
    </form>
  );
}

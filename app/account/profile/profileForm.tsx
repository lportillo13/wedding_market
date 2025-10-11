"use client";

import { useActionState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { isSupportedLanguage, type SupportedLanguage } from "@/lib/i18n";
import { saveProfile, type SaveProfileState } from "./actions";

const initialState: SaveProfileState = { ok: false, message: "" };

const THEME_OPTIONS = [
  { value: "", label: "—" },
  { value: "classic", label: "Classic" },
  { value: "boho", label: "Boho" },
  { value: "rustic", label: "Rustic" },
  { value: "beach", label: "Beach" },
  { value: "garden", label: "Garden" },
  { value: "modern", label: "Modern" },
  { value: "vintage", label: "Vintage" },
];

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

  const languageOptions = useMemo(
    () => [
      { value: "en" as SupportedLanguage, label: dictionary.languageSelector.english },
      { value: "es" as SupportedLanguage, label: dictionary.languageSelector.spanish },
    ],
    [dictionary.languageSelector.english, dictionary.languageSelector.spanish]
  );

  return (
    <form action={formAction} className="border rounded p-3 bg-body">
      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label" htmlFor="profile-name">
            Name
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
        <div className="col-md-6 mb-3">
          <label className="form-label" htmlFor="profile-phone">
            Phone
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
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label" htmlFor="profile-email">
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            className="form-control"
            value={initial.email}
            disabled
            readOnly
          />
          <div className="form-text">Email is managed via your login credentials.</div>
        </div>
        <div className="col-md-6 mb-3">
          <label className="form-label" htmlFor="profile-country">
            Country
          </label>
          <input
            id="profile-country"
            name="country"
            type="text"
            className="form-control"
            defaultValue={initial.country}
            autoComplete="country-name"
          />
          {state.fieldErrors?.country && <div className="text-danger small">{state.fieldErrors.country}</div>}
        </div>
        <div className="col-md-6 mb-3">
          <label className="form-label" htmlFor="profile-language">
            Preferred language
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
          <div className="form-text">Changes the default language shown after you log in.</div>
          {state.fieldErrors?.language && <div className="text-danger small">{state.fieldErrors.language}</div>}
        </div>
      </div>

      <hr className="my-4" />

      <h2 className="h5 mb-3">Wedding preferences</h2>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label" htmlFor="profile-date">
            Tentative wedding date
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
        <div className="col-md-6 mb-3">
          <label className="form-label" htmlFor="profile-guests">
            Estimate amount of people
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
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label" htmlFor="profile-budget">
            Budget (USD)
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
        <div className="col-md-6 mb-3">
          <label className="form-label" htmlFor="profile-theme">
            Theme of wedding
          </label>
          <select
            id="profile-theme"
            name="wedding_theme"
            className="form-select"
            defaultValue={initial.wedding_theme}
          >
            {THEME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {state.fieldErrors?.wedding_theme && <div className="text-danger small">{state.fieldErrors.wedding_theme}</div>}
        </div>
      </div>

      {state.message && (
        <div className={`alert ${state.ok ? "alert-success" : "alert-danger"}`}>{state.message}</div>
      )}

      <div className="d-flex justify-content-end">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useLanguage } from "@/contexts/LanguageContext";
import type { VendorProfileDTO } from "@/types/vendor-profile";
import type { VendorContactPrefill } from "@/app/vendors/[slug]/data";

type VendorContactProps = {
  vendor: VendorProfileDTO["vendor"];
  prefill: VendorContactPrefill | null;
  isVendor: boolean;
  isLoggedIn: boolean;
  loginHref: string;
};

type FormValues = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  guest_count: string;
  city: string;
  budget: string;
  language: string;
  theme: string;
  message: string;
  event_date?: string;
  flexible: boolean;
  honeypot?: string;
};

type SubmitState = "idle" | "loading" | "success" | "error";

function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function buildDefaultValues(prefill: VendorContactPrefill | null): FormValues {
  return {
    first_name: prefill?.firstName ?? "",
    last_name: prefill?.lastName ?? "",
    email: prefill?.email ?? "",
    phone: prefill?.phone ?? "",
    guest_count: prefill?.guestCount ?? "",
    city: prefill?.city ?? "",
    budget: prefill?.budget ?? "",
    language: prefill?.language ?? "es",
    theme: prefill?.theme ?? "",
    message: prefill?.message ?? "",
    event_date: prefill?.eventDate ?? "",
    flexible: prefill?.flexible ?? false,
    honeypot: "",
  };
}

export default function VendorContact({ vendor, prefill, isVendor, isLoggedIn, loginHref }: VendorContactProps) {
  const { dictionary, language } = useLanguage();
  const labels = dictionary.vendorPublic.contact;
  const headerLabels = dictionary.vendorPublic.header;
  const accountFormLabels = dictionary.account.profile.form;
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    defaultValues: buildDefaultValues(prefill),
  });

  const languageOptions = useMemo(
    () =>
      language === "es"
        ? [
            { value: "es", label: "Español" },
            { value: "en", label: "Inglés" },
            { value: "de", label: "Deutsch" },
            { value: "fr", label: "Français" },
          ]
        : [
            { value: "es", label: "Spanish" },
            { value: "en", label: "English" },
            { value: "de", label: "Deutsch" },
            { value: "fr", label: "Français" },
          ],
    [language],
  );
  const themeOptions = useMemo(
    () => [
      { value: "", label: accountFormLabels.weddingTheme.options.none },
      { value: "classic", label: accountFormLabels.weddingTheme.options.classic },
      { value: "boho", label: accountFormLabels.weddingTheme.options.boho },
      { value: "rustic", label: accountFormLabels.weddingTheme.options.rustic },
      { value: "beach", label: accountFormLabels.weddingTheme.options.beach },
      { value: "garden", label: accountFormLabels.weddingTheme.options.garden },
      { value: "modern", label: accountFormLabels.weddingTheme.options.modern },
      { value: "vintage", label: accountFormLabels.weddingTheme.options.vintage },
    ],
    [
      accountFormLabels.weddingTheme.options.none,
      accountFormLabels.weddingTheme.options.classic,
      accountFormLabels.weddingTheme.options.boho,
      accountFormLabels.weddingTheme.options.rustic,
      accountFormLabels.weddingTheme.options.beach,
      accountFormLabels.weddingTheme.options.garden,
      accountFormLabels.weddingTheme.options.modern,
      accountFormLabels.weddingTheme.options.vintage,
    ],
  );
  const extraLabels =
    language === "es"
      ? {
          guestCount: "Número de invitados",
          city: "Ciudad (opcional)",
          budget: "Presupuesto (USD, opcional)",
          language: "Idioma (opcional)",
          theme: "Estilo de boda (opcional)",
          optional: "opcional",
          requiredHint: "* Campos requeridos",
        }
      : {
          guestCount: "Number of guests",
          city: "City (optional)",
          budget: "Budget (USD, optional)",
          language: "Language (optional)",
          theme: "Wedding style (optional)",
          optional: "optional",
          requiredHint: "* Required fields",
        };

  useEffect(() => {
    reset(buildDefaultValues(prefill));
  }, [prefill, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (values.honeypot) return;
    setSubmitState("loading");
    setErrorMessage(null);
    try {
      const response = await fetch("/api/rfqs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfq_id: prefill?.rfqId ?? null,
          vendor_id: vendor.id,
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          phone: values.phone || null,
          guest_count: values.guest_count ? Number(values.guest_count) : null,
          budget: values.budget ? Number(values.budget) : null,
          city: values.city || null,
          state: null,
          country: "Costa Rica",
          language: values.language || null,
          theme: values.theme || null,
          message: values.message,
          event_date: values.event_date || null,
          flexible: values.flexible,
        }),
      });

      const result = await response.json().catch(() => ({ ok: false, message: labels.unexpected }));
      if (!response.ok || !result?.ok) {
        throw new Error(result?.message || labels.failed);
      }
      setSubmitState("success");
      reset(buildDefaultValues(prefill));
    } catch (error) {
      const message = error instanceof Error ? error.message : labels.genericError;
      setErrorMessage(message);
      setSubmitState("error");
    }
  });

  if (isVendor) {
    return (
      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <h2 className="h3 mb-3">{labels.vendorHeading}</h2>
          <p className="text-muted">{fill(labels.vendorIntro, { vendor: vendor.name })}</p>
          <Link href="/vendor/inbox" className="btn btn-primary btn-lg">
            {headerLabels.viewReceivedRequests}
          </Link>
        </div>
        <div className="col-12 col-lg-5">
          <aside className="bg-light border rounded p-4 h-100">
            <h3 className="h5">{labels.detailsHeading}</h3>
            <ul className="list-unstyled small mb-0">
              {vendor.phone ? <li className="mb-2"><strong>{labels.phoneLabel}</strong> <a href={`tel:${vendor.phone}`}>{vendor.phone}</a></li> : null}
              {vendor.websiteUrl ? <li className="mb-2"><strong>{labels.websiteLabel}</strong>{" "}<a href={vendor.websiteUrl} target="_blank" rel="noreferrer">{vendor.name}</a></li> : null}
              {vendor.location.addressLabel ? (
                <li className="mb-2">
                  <strong>{labels.addressLabel}</strong> {vendor.location.addressLabel}
                  {vendor.location.mapUrl ? (
                    <div>
                      <a href={vendor.location.mapUrl} target="_blank" rel="noreferrer">{labels.viewMap}</a>
                    </div>
                  ) : null}
                </li>
              ) : null}
            </ul>
          </aside>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <h2 className="h3 mb-3">{labels.heading}</h2>
          <p className="text-muted">{labels.loginRequired}</p>
          <Link href={loginHref} className="btn btn-primary btn-lg">
            {labels.logInAction}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="row g-4">
      <div className="col-12 col-lg-7">
        <h2 className="h3 mb-3">{labels.heading}</h2>
        <p className="text-muted">{fill(labels.intro, { vendor: vendor.name })}</p>

        {submitState === "success" ? <div className="alert alert-success" role="status">{labels.success}</div> : null}
        {submitState === "error" && errorMessage ? <div className="alert alert-danger" role="alert">{errorMessage}</div> : null}

        {submitState !== "success" ? (
          <form className="row g-3" onSubmit={onSubmit} noValidate>
            <input type="text" className="d-none" tabIndex={-1} autoComplete="off" {...register("honeypot")} />
            <div className="col-12"><p className="small text-muted mb-0">{extraLabels.requiredHint}</p></div>
            <div className="col-md-6">
              <label htmlFor="first_name" className="form-label">{labels.firstName} *</label>
              <input id="first_name" type="text" className={`form-control ${formState.errors.first_name ? "is-invalid" : ""}`} {...register("first_name", { required: labels.firstNameRequired })} required />
              {formState.errors.first_name ? <div className="invalid-feedback">{formState.errors.first_name.message}</div> : null}
            </div>
            <div className="col-md-6">
              <label htmlFor="last_name" className="form-label">{labels.lastName} *</label>
              <input id="last_name" type="text" className={`form-control ${formState.errors.last_name ? "is-invalid" : ""}`} {...register("last_name", { required: labels.lastNameRequired })} required />
              {formState.errors.last_name ? <div className="invalid-feedback">{formState.errors.last_name.message}</div> : null}
            </div>
            <div className="col-md-6">
              <label htmlFor="email" className="form-label">{labels.email} *</label>
              <input id="email" type="email" className={`form-control ${formState.errors.email ? "is-invalid" : ""}`} {...register("email", { required: labels.emailRequired, pattern: { value: /.+@.+\..+/, message: labels.emailInvalid } })} required />
              {formState.errors.email ? <div className="invalid-feedback">{formState.errors.email.message}</div> : null}
            </div>
            <div className="col-md-6">
              <label htmlFor="phone" className="form-label">{labels.phoneOptional}</label>
              <input id="phone" type="tel" className="form-control" {...register("phone")} />
            </div>
            <div className="col-md-6">
              <label htmlFor="event_date" className="form-label">{labels.eventDate} ({extraLabels.optional})</label>
              <input id="event_date" type="date" className="form-control" {...register("event_date")} />
              <div className="form-check mt-2">
                <input id="flexible" type="checkbox" className="form-check-input" {...register("flexible")} />
                <label htmlFor="flexible" className="form-check-label">{labels.flexibleDate}</label>
              </div>
            </div>
            <div className="col-md-6">
              <label htmlFor="guest_count" className="form-label">{extraLabels.guestCount} *</label>
              <input id="guest_count" type="number" min={1} className={`form-control ${formState.errors.guest_count ? "is-invalid" : ""}`} {...register("guest_count", { required: labels.guestRangeRequired })} required />
              {formState.errors.guest_count ? <div className="invalid-feedback">{formState.errors.guest_count.message}</div> : null}
            </div>
            <div className="col-md-6">
              <label htmlFor="city" className="form-label">{extraLabels.city}</label>
              <input id="city" type="text" className="form-control" {...register("city")} />
            </div>
            <div className="col-md-6">
              <label htmlFor="budget" className="form-label">{extraLabels.budget}</label>
              <input id="budget" type="number" min={0} className="form-control" {...register("budget")} />
            </div>
            <div className="col-md-6">
              <label htmlFor="language" className="form-label">{extraLabels.language}</label>
              <select id="language" className="form-select" {...register("language")}>
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="theme" className="form-label">{extraLabels.theme}</label>
              <select id="theme" className="form-select" {...register("theme")}>
                {themeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12">
              <label htmlFor="message" className="form-label">{labels.message} *</label>
              <textarea id="message" className={`form-control ${formState.errors.message ? "is-invalid" : ""}`} rows={5} placeholder={labels.messagePlaceholder} {...register("message", { required: labels.messageRequired })} required />
              {formState.errors.message ? <div className="invalid-feedback">{formState.errors.message.message}</div> : null}
            </div>
            <div className="col-12">
              <button className="btn btn-primary btn-lg" type="submit" disabled={submitState === "loading"}>
                {submitState === "loading"
                  ? labels.submitting
                  : prefill?.hasExistingRequest
                    ? labels.update
                    : labels.submit}
              </button>
            </div>
          </form>
        ) : null}
      </div>
      <div className="col-12 col-lg-5">
        <aside className="bg-light border rounded p-4 h-100">
          <h3 className="h5">{labels.detailsHeading}</h3>
          <ul className="list-unstyled small mb-0">
            {vendor.phone ? <li className="mb-2"><strong>{labels.phoneLabel}</strong> <a href={`tel:${vendor.phone}`}>{vendor.phone}</a></li> : null}
            {vendor.websiteUrl ? <li className="mb-2"><strong>{labels.websiteLabel}</strong>{" "}<a href={vendor.websiteUrl} target="_blank" rel="noreferrer">{vendor.name}</a></li> : null}
            {vendor.location.addressLabel ? (
              <li className="mb-2">
                <strong>{labels.addressLabel}</strong> {vendor.location.addressLabel}
                {vendor.location.mapUrl ? (
                  <div>
                    <a href={vendor.location.mapUrl} target="_blank" rel="noreferrer">{labels.viewMap}</a>
                  </div>
                ) : null}
              </li>
            ) : null}
          </ul>
        </aside>
      </div>
    </div>
  );
}

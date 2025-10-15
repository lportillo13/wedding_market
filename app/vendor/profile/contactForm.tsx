"use client";

import { useActionState, useState } from "react";
import { useTranslation } from "@/contexts/LanguageContext";
import { saveContact, type FormMessageState } from "./actions";

type ContactFormShape = {
  phone: string;
  website_url: string;
  map_url: string;
  address_label: string;
  starting_price: string;
  starting_price_currency: string;
  event_types: string;
  years_in_business: string;
  languages: string;
  team_size_range: string;
};

type ContactFormProps = {
  initial: ContactFormShape;
};

const initialState: FormMessageState = { ok: false, message: "" };

export default function ContactForm({ initial }: ContactFormProps) {
  const [state, formAction, isPending] = useActionState(saveContact, initialState);
  const [form, setForm] = useState<ContactFormShape>(initial);
  const t = useTranslation();

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <form action={formAction}>
      <div className="row g-3">
        <div className="col-12 col-md-6">
          <label className="form-label" htmlFor="contact-phone">
            {t("vendorDashboard.profileContact.phoneLabel")}
          </label>
          <input
            id="contact-phone"
            name="phone"
            className="form-control"
            value={form.phone}
            onChange={onChange}
          />
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label" htmlFor="contact-website">
            {t("vendorDashboard.profileContact.websiteLabel")}
          </label>
          <input
            id="contact-website"
            name="website_url"
            className="form-control"
            value={form.website_url}
            onChange={onChange}
          />
        </div>
        <div className="col-12">
          <label className="form-label" htmlFor="contact-map-url">
            {t("vendorDashboard.profileContact.mapLabel")}
          </label>
          <input
            id="contact-map-url"
            name="map_url"
            className="form-control"
            value={form.map_url}
            onChange={onChange}
          />
          <div className="form-text">{t("vendorDashboard.profileContact.mapHelp")}</div>
        </div>
        <div className="col-12">
          <label className="form-label" htmlFor="contact-address-label">
            {t("vendorDashboard.profileContact.addressLabel")}
          </label>
          <input
            id="contact-address-label"
            name="address_label"
            className="form-control"
            value={form.address_label}
            onChange={onChange}
          />
        </div>
        <div className="col-12 col-md-4">
          <label className="form-label" htmlFor="contact-starting-price">
            {t("vendorDashboard.profileContact.startingPriceLabel")}
          </label>
          <input
            id="contact-starting-price"
            name="starting_price"
            className="form-control"
            value={form.starting_price}
            onChange={onChange}
            placeholder={t("vendorDashboard.profileContact.currencyPlaceholder")}
          />
          <div className="form-text">{t("vendorDashboard.profileContact.startingPriceHelp")}</div>
        </div>
        <div className="col-12 col-md-4">
          <label className="form-label" htmlFor="contact-starting-currency">
            {t("vendorDashboard.profileContact.startingCurrencyLabel")}
          </label>
          <input
            id="contact-starting-currency"
            name="starting_price_currency"
            className="form-control"
            value={form.starting_price_currency}
            onChange={onChange}
            placeholder="USD"
          />
        </div>
        <div className="col-12 col-md-4">
          <label className="form-label" htmlFor="contact-years">
            {t("vendorDashboard.profileContact.yearsInBusinessLabel")}
          </label>
          <input
            id="contact-years"
            name="years_in_business"
            className="form-control"
            value={form.years_in_business}
            onChange={onChange}
          />
        </div>
        <div className="col-12">
          <label className="form-label" htmlFor="contact-event-types">
            {t("vendorDashboard.profileContact.eventTypesLabel")}
          </label>
          <textarea
            id="contact-event-types"
            name="event_types"
            className="form-control"
            rows={2}
            value={form.event_types}
            onChange={onChange}
          />
          <div className="form-text">{t("vendorDashboard.profileContact.csvHelp")}</div>
        </div>
        <div className="col-12">
          <label className="form-label" htmlFor="contact-languages">
            {t("vendorDashboard.profileContact.languagesLabel")}
          </label>
          <textarea
            id="contact-languages"
            name="languages"
            className="form-control"
            rows={2}
            value={form.languages}
            onChange={onChange}
          />
          <div className="form-text">{t("vendorDashboard.profileContact.csvHelp")}</div>
        </div>
        <div className="col-12">
          <label className="form-label" htmlFor="contact-team-size">
            {t("vendorDashboard.profileContact.teamSizeLabel")}
          </label>
          <input
            id="contact-team-size"
            name="team_size_range"
            className="form-control"
            value={form.team_size_range}
            onChange={onChange}
          />
        </div>
      </div>

      {state.message ? (
        <div className={`alert ${state.ok ? "alert-success" : "alert-danger"} mt-3`} role="status">
          {state.message}
        </div>
      ) : null}

      <button className="btn btn-primary mt-3" disabled={isPending}>
        {isPending
          ? t("vendorDashboard.profileContact.saving")
          : t("vendorDashboard.profileContact.save")}
      </button>
    </form>
  );
}

"use client";

import { useContext, useMemo, useState } from "react";
import {useProfileAction} from '../profile/useProfileAction';
import ProfileSaveBar from '../profile/ProfileSaveBar';
import {ProfileSectionContext} from '../profile/ProfileEditorContext';
import { saveLocation, type SaveLocState } from "./actions";
import MapPicker from "./MapPicker";
import { useTranslation } from "@/contexts/LanguageContext";
import { buildCountryOptions } from "@/lib/countries";

type Initial = {
  address: string; city: string; state: string; country: string;
  lat: number | null; lng: number | null; service_radius_km: number;
};

const initState: SaveLocState = { ok: false, message: "" };

export default function LocationForm({ initial }: { initial: Initial }) {
  const [state, formAction, pending] = useProfileAction(saveLocation, initState);
  const section = useContext(ProfileSectionContext);
  const [form, setForm] = useState<Initial>(initial);
  const t = useTranslation();
  const countryOptions = useMemo(() => buildCountryOptions(form.country), [form.country]);


  function updateFromMap(v: {
    lat: number | null; lng: number | null;
    address?: string; city?: string; state?: string; country?: string;
  }) {
    section?.changed?.();
    setForm(prev => ({
      ...prev,
      lat: v.lat ?? prev.lat,
      lng: v.lng ?? prev.lng,
      address: v.address ?? prev.address,
      city: v.city ?? prev.city,
      state: v.state ?? prev.state,
      country: v.country ?? prev.country,
    }));
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === "service_radius_km" ? Number(value) : value }));
  }

  return (
    <form action={formAction} data-profile-save suppressHydrationWarning>
      <div className="mb-3">
        <MapPicker
          apiKey={apiKey}
          lat={form.lat}
          lng={form.lng}
          radiusKm={form.service_radius_km}   // NEW: draw coverage circle
          onChange={updateFromMap}
        />
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="location-address">
          {t("vendorDashboard.location.form.addressLabel")}
        </label>
        <input id="location-address" name="address" className="form-control" value={form.address} onChange={onChange} />
      </div>

      <div className="row">
        <div className="col-md-4 mb-3">
          <label className="form-label" htmlFor="location-city">
            {t("vendorDashboard.location.form.cityLabel")}
          </label>
          <input id="location-city" name="city" className="form-control" value={form.city} onChange={onChange} />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label" htmlFor="location-state">
            {t("vendorDashboard.location.form.stateLabel")}
          </label>
          <input id="location-state" name="state" className="form-control" value={form.state} onChange={onChange} />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label" htmlFor="location-country">
            {t("vendorDashboard.location.form.countryLabel")}
          </label>
          <select
            id="location-country"
            name="country"
            className="form-select"
            value={form.country}
            onChange={onChange}
          >
            <option value="">{t("vendorDashboard.location.form.countryPlaceholder")}</option>
            {countryOptions.map(country => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label" htmlFor="location-service-radius">
            {t("vendorDashboard.location.form.radiusLabel")}
          </label>
          <input
            id="location-service-radius"
            name="service_radius_km"
            type="number"
            min={1}
            max={500}
            className="form-control"
            value={form.service_radius_km}
            onChange={onChange}
          />
        </div>
      </div>

      {/* Hidden fields so the server receives values reliably */}
      <input type="hidden" name="lat" value={form.lat ?? ""} />
      <input type="hidden" name="lng" value={form.lng ?? ""} />
      <input type="hidden" name="city" value={form.city} />
      <input type="hidden" name="state" value={form.state} />
      <input type="hidden" name="country" value={form.country} />
      <input type="hidden" name="address" value={form.address} />

      <ProfileSaveBar state={state} pending={pending} label={t('vendorDashboard.location.form.save')}/>
    </form>
  );
}

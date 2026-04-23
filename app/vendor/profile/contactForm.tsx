"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/contexts/LanguageContext";
import { uploadWithProgress } from "@/lib/client/uploads";
import { resolveMediaUrl, shouldRenderUnoptimizedMedia } from "@/lib/media-url";
import { removeLogoImage, saveContact, type FormMessageState, type ImageActionState } from "./actions";

type ContactFormShape = {
  logo_url: string;
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
const initialImageState: ImageActionState = { ok: false, message: "" };

function ProgressBar({ pending, progress }: { pending: boolean; progress: number }) {
  if (!pending && progress <= 0) return null;
  return (
    <div className="mt-2">
      <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${progress}%` }}>
          {progress}%
        </div>
      </div>
    </div>
  );
}

function UploadMeta({
  pending,
  progress,
  selection,
}: {
  pending: boolean;
  progress: number;
  selection: string[];
}) {
  if (!pending && selection.length === 0) return null;
  return (
    <div className="wm-vendor-media-status wm-vendor-media-status--warm">
      <div className="d-flex align-items-center justify-content-between gap-3">
        <div className="min-w-0">
          <div className="fw-semibold text-dark">
            {pending ? "Uploading logo" : `Selected ${selection.length} file${selection.length === 1 ? "" : "s"}`}
          </div>
          {selection.length > 0 ? <div className="small text-secondary text-truncate">{selection.join(", ")}</div> : null}
        </div>
        <div className="wm-vendor-media-status__badge">{progress}%</div>
      </div>
      <ProgressBar pending={pending || progress > 0} progress={progress} />
    </div>
  );
}

export default function ContactForm({ initial }: ContactFormProps) {
  const [state, formAction, isPending] = useActionState(saveContact, initialState);
  const [logoState, setLogoState] = useState(initialImageState);
  const [removeState, removeAction, removePending] = useActionState(removeLogoImage, initialImageState);
  const [logoPending, setLogoPending] = useState(false);
  const [logoProgress, setLogoProgress] = useState(0);
  const [logoSelection, setLogoSelection] = useState<string[]>([]);
  const [form, setForm] = useState<ContactFormShape>(initial);
  const router = useRouter();
  const t = useTranslation();

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function uploadLogo(formData: FormData) {
    try {
      setLogoPending(true);
      setLogoProgress(0);
      setLogoState(initialImageState);
      const file = formData.get("logo");
      if (!(file instanceof File)) {
        throw new Error("Please choose an image.");
      }

      const payload = new FormData();
      payload.set("target", "vendor-logo");
      payload.set("file", file);
      const response = await uploadWithProgress<{ asset?: { url?: string } }>("/api/uploads", payload, setLogoProgress);
      const url = response.asset?.url ?? "";

      setForm((prev) => ({ ...prev, logo_url: url }));
      setLogoState({ ok: true, message: "Logo updated." });
      setLogoSelection([]);
      setLogoProgress(0);
      router.refresh();
    } catch (error) {
      setLogoState({ ok: false, message: error instanceof Error ? error.message : "Upload failed." });
    } finally {
      setLogoPending(false);
    }
  }

  return (
    <div className="d-grid gap-4">
      <section className="wm-vendor-media-card">
        <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
          <div>
            <h3 className="h6 mb-1">Brand logo</h3>
            <p className="small text-muted mb-0">This logo appears in the public vendor header next to your name.</p>
          </div>
          {form.logo_url ? (
            <form action={removeAction}>
              <button className="btn btn-outline-danger btn-sm" disabled={removePending} type="submit">
                {removePending ? "Removing..." : "Remove"}
              </button>
            </form>
          ) : null}
        </div>

        {form.logo_url ? (
          <div className="wm-vendor-media-preview wm-vendor-media-preview--thumb mb-3">
            <Image
              src={resolveMediaUrl(form.logo_url)}
              alt="Vendor logo"
              width={180}
              height={180}
              unoptimized={shouldRenderUnoptimizedMedia(form.logo_url)}
              className="rounded"
              style={{ maxWidth: "180px", height: "auto" }}
            />
          </div>
        ) : (
          <p className="text-muted small mb-3">No logo uploaded yet.</p>
        )}

        <form action={uploadLogo} encType="multipart/form-data">
          <div className="mb-2">
            <input
              className="form-control"
              type="file"
              name="logo"
              accept="image/*"
              required
              onChange={(event) => setLogoSelection(event.target.files?.[0] ? [event.target.files[0].name] : [])}
            />
          </div>
          <button className="btn btn-primary btn-sm" disabled={logoPending} type="submit">
            {logoPending ? "Uploading..." : "Upload logo"}
          </button>
        </form>
        <UploadMeta pending={logoPending} progress={logoProgress} selection={logoSelection} />
        {logoState.message ? (
          <div className={`alert ${logoState.ok ? "alert-success" : "alert-danger"} mt-3`} role="status">
            {logoState.message}
          </div>
        ) : null}
        {removeState.message ? (
          <div className={`alert ${removeState.ok ? "alert-success" : "alert-danger"} mt-3`} role="status">
            {removeState.message}
          </div>
        ) : null}
      </section>

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
    </div>
  );
}

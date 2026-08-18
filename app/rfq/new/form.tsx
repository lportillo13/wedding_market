"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useMemo, useState } from "react";
import ContextualSponsoredUnits from "@/components/ads/ContextualSponsoredUnits";
import { useLanguage } from "@/contexts/LanguageContext";
import { tokenizeAdText } from "@/lib/content/vendorAds";
import { clearShortlist, getShortlist, removeFromShortlist } from "@/lib/shortlist";
import { useVendorSummaries } from "@/lib/useVendorSummaries";
import { createRfqAndInvites, type CreateRfqState } from "./actions";

export type RfqPrefill = {
  eventDate?: string | null;
  guestCount?: number | null;
  budget?: number | null;
  theme?: string | null;
};

export default function NewRfqForm({ prefill }: { prefill: RfqPrefill }) {
  const [ids, setIds] = useState<string[]>(() => (typeof window !== "undefined" ? getShortlist() : []));
  const [state, action, pending] = useActionState<CreateRfqState, FormData>(createRfqAndInvites, { ok: false });
  const { vendorsById, loading: vendorsLoading, error: vendorsError } = useVendorSummaries(ids);
  const vendorIdsJson = useMemo(() => JSON.stringify(ids), [ids]);
  const { dictionary, language } = useLanguage();
  const labels = dictionary.rfq.newPage;

  const eventDate = prefill.eventDate ?? "";
  const guestCount = prefill.guestCount ?? "";
  const budgetValue = prefill.budget ?? "";
  const theme = prefill.theme ?? "";
  const [adGuestCount, setAdGuestCount] = useState<number | null>(prefill.guestCount ?? null);
  const [adBudget, setAdBudget] = useState<number | null>(prefill.budget ?? null);
  const [adTheme, setAdTheme] = useState<string>(theme);
  const [adNotes, setAdNotes] = useState("");
  const rfqKeywordHints = useMemo(
    () =>
      ids.flatMap((id) => {
        const vendor = vendorsById[id];
        if (!vendor) {
          return [];
        }

        return [vendor.business_name, ...(vendor.categories ?? [])];
      }),
    [ids, vendorsById],
  );
  const rfqAdKeywords = useMemo(
    () => [...rfqKeywordHints, ...tokenizeAdText(adNotes)],
    [adNotes, rfqKeywordHints],
  );

  return (
    <main className="container py-4" style={{ maxWidth: 920 }}>
      <h1 className="mb-3">{labels.title}</h1>

      {ids.length === 0 ? (
        <div className="alert alert-warning">
          {labels.emptyBeforeLink}
          <Link href="/vendors">{labels.emptyLink}</Link>
          {labels.emptyAfterLink}
        </div>
      ) : (
        <>
          <div className="mb-3">
            <p className="form-label">{labels.selectedVendors}</p>
            {vendorsError && (
              <div className="alert alert-warning" role="status">
                {labels.vendorsLoadError}
              </div>
            )}
            <div className="d-flex flex-wrap gap-2">
              {ids.map((id) => {
                const vendor = vendorsById[id];
                const vendorName = vendor?.business_name ?? (vendorsLoading ? labels.vendorLoading : labels.vendorUnavailable);

                return (
                  <span
                    key={id}
                    className="badge text-bg-secondary d-inline-flex align-items-center gap-2"
                    title={vendorName}
                  >
                    <span className="text-truncate" style={{ maxWidth: 180 }}>
                      {vendorName}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light"
                      onClick={() => {
                        removeFromShortlist(id);
                        setIds((current) => current.filter((value) => value !== id));
                      }}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
            <div className="form-text">{labels.maxVendorsHelp}</div>
          </div>

          <ContextualSponsoredUnits
            pageKey="rfq"
            headline={labels.title}
            keywords={rfqAdKeywords}
            themes={adTheme ? [adTheme] : []}
            countries={["Costa Rica"]}
            budget={adBudget}
            guestCount={adGuestCount}
          />

          <form action={action} className="border rounded p-3 bg-body">
            <input type="hidden" name="vendor_ids_json" value={vendorIdsJson} />
            <p className="small text-muted">{language === "es" ? "* Campos requeridos" : "* Required fields"}</p>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label" htmlFor="rfq-event-date">
                  {labels.eventDateLabel} ({language === "es" ? "opcional" : "optional"})
                </label>
                <input id="rfq-event-date" className="form-control" type="date" name="event_date" defaultValue={eventDate} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label" htmlFor="rfq-guest-count">
                  {labels.guestCountLabel} *
                </label>
                <input
                  id="rfq-guest-count"
                  className="form-control"
                  type="number"
                  name="guest_count"
                  min={1}
                  required
                  defaultValue={guestCount}
                  onChange={(event) => setAdGuestCount(event.target.value ? Number(event.target.value) : null)}
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label" htmlFor="rfq-city">
                  {labels.cityLabel} ({language === "es" ? "opcional" : "optional"})
                </label>
                <input id="rfq-city" className="form-control" name="city" />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label" htmlFor="rfq-budget">
                  {language === "es" ? "Presupuesto (USD, opcional)" : "Budget (USD, optional)"}
                </label>
                <input
                  id="rfq-budget"
                  className="form-control"
                  type="number"
                  name="budget"
                  min={0}
                  defaultValue={budgetValue}
                  onChange={(event) => setAdBudget(event.target.value ? Number(event.target.value) : null)}
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label" htmlFor="rfq-language">
                  {labels.languageLabel} ({language === "es" ? "opcional" : "optional"})
                </label>
                <select id="rfq-language" className="form-select" name="language" defaultValue={language}>
                  <option value="es">{labels.languageOptions.es}</option>
                  <option value="en">{labels.languageOptions.en}</option>
                  <option value="de">{labels.languageOptions.de}</option>
                  <option value="fr">{labels.languageOptions.fr}</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="rfq-theme">
                {labels.themeLabel} ({language === "es" ? "opcional" : "optional"})
              </label>
              <select
                id="rfq-theme"
                className="form-select"
                name="theme"
                defaultValue={theme}
                onChange={(event) => setAdTheme(event.target.value)}
              >
                <option value="">{labels.themeOptions.none}</option>
                <option value="classic">{labels.themeOptions.classic}</option>
                <option value="boho">{labels.themeOptions.boho}</option>
                <option value="rustic">{labels.themeOptions.rustic}</option>
                <option value="beach">{labels.themeOptions.beach}</option>
                <option value="garden">{labels.themeOptions.garden}</option>
                <option value="modern">{labels.themeOptions.modern}</option>
                <option value="vintage">{labels.themeOptions.vintage}</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="rfq-notes">
                {labels.notesLabel} *
              </label>
              <textarea
                id="rfq-notes"
                className="form-control"
                name="notes"
                rows={4}
                maxLength={2000}
                required
                onChange={(event) => setAdNotes(event.target.value)}
              />
            </div>

            {!state.ok && state.message && <div className="alert alert-danger">{state.message}</div>}

            <div className="d-flex gap-2">
              <button className="btn btn-primary" disabled={pending}>
                {pending ? labels.submitting : labels.submit}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  clearShortlist();
                  setIds([]);
                }}
              >
                {labels.clearShortlist}
              </button>
            </div>
          </form>
        </>
      )}
    </main>
  );
}

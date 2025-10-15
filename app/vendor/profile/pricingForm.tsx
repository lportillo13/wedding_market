"use client";

import { useActionState, useMemo, useState } from "react";
import { useTranslation } from "@/contexts/LanguageContext";
import type { TranslationKey } from "@/lib/i18n";
import { savePricing, type FormMessageState } from "./actions";

type PricingItemState = {
  itemKey: string;
  price: string;
  contactForPrice: boolean;
  notesEn: string;
  notesEs: string;
};

type PricingItemStringField = Exclude<keyof PricingItemState, "contactForPrice">;

type PricingFormInitial = {
  items: PricingItemState[];
  typicalSpend: string;
  typicalSpendCurrency: string;
  peakSeasons: string;
};

type PricingFormProps = {
  initial: PricingFormInitial;
};

const initialState: FormMessageState = { ok: false, message: "" };

const PRICING_LABELS = {
  reception: "vendorDashboard.profilePricing.reception",
  ceremony: "vendorDashboard.profilePricing.ceremony",
  bar: "vendorDashboard.profilePricing.bar",
  catering: "vendorDashboard.profilePricing.catering",
} as const satisfies Record<string, TranslationKey>;

export default function PricingForm({ initial }: PricingFormProps) {
  const [state, formAction, isPending] = useActionState(savePricing, initialState);
  const [items, setItems] = useState<PricingItemState[]>(initial.items);
  const [typicalSpend, setTypicalSpend] = useState(initial.typicalSpend);
  const [typicalCurrency, setTypicalCurrency] = useState(initial.typicalSpendCurrency);
  const [peakSeasons, setPeakSeasons] = useState(initial.peakSeasons);
  const t = useTranslation();

  function handleItemChange<T extends keyof PricingItemState>(
    index: number,
    field: T,
    value: PricingItemState[T]
  ) {
    setItems((prev) => {
      const next = [...prev];
      const current = { ...next[index] };
      if (field === "contactForPrice") {
        const contactForPrice = value as PricingItemState["contactForPrice"];
        current.contactForPrice = contactForPrice;
        if (contactForPrice) {
          current.price = "";
        }
      } else {
        const stringField = field as PricingItemStringField;
        const stringValue = value as PricingItemState[PricingItemStringField];
        current[stringField] = stringValue;
      }
      next[index] = current;
      return next;
    });
  }

  const pricingPayload = useMemo(
    () => JSON.stringify(items.map(({ itemKey, price, contactForPrice, notesEn, notesEs }) => ({
      itemKey,
      price,
      contactForPrice,
      notesEn,
      notesEs,
    }))),
    [items]
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="pricing_items" value={pricingPayload} />
      <div className="mb-4">
        <label className="form-label" htmlFor="pricing-typical-spend">
          {t("vendorDashboard.profilePricing.typicalSpendLabel")}
        </label>
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <input
              id="pricing-typical-spend"
              name="typical_spend"
              className="form-control"
              value={typicalSpend}
              onChange={(event) => setTypicalSpend(event.target.value)}
              placeholder={t("vendorDashboard.profilePricing.typicalSpendPlaceholder")}
            />
          </div>
          <div className="col-12 col-md-3">
            <input
              id="pricing-typical-currency"
              name="typical_currency"
              className="form-control"
              value={typicalCurrency}
              onChange={(event) => setTypicalCurrency(event.target.value)}
              placeholder="USD"
            />
          </div>
        </div>
        <div className="form-text">{t("vendorDashboard.profilePricing.typicalSpendHelp")}</div>
      </div>

      <div className="mb-4">
        <label className="form-label" htmlFor="pricing-peak-seasons">
          {t("vendorDashboard.profilePricing.peakSeasonsLabel")}
        </label>
        <textarea
          id="pricing-peak-seasons"
          name="peak_seasons"
          className="form-control"
          rows={2}
          value={peakSeasons}
          onChange={(event) => setPeakSeasons(event.target.value)}
        />
        <div className="form-text">{t("vendorDashboard.profilePricing.csvHelp")}</div>
      </div>

      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th scope="col">{t("vendorDashboard.profilePricing.packageColumn")}</th>
              <th scope="col">{t("vendorDashboard.profilePricing.priceColumn")}</th>
              <th scope="col">{t("vendorDashboard.profilePricing.notesColumn")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const labelKey = PRICING_LABELS[item.itemKey as keyof typeof PRICING_LABELS];
              const packageLabel = labelKey ? t(labelKey) : item.itemKey;
              return (
                <tr key={item.itemKey}>
                  <th scope="row">{packageLabel}</th>
                  <td>
                    <div className="d-flex flex-column gap-2">
                      <input
                        type="text"
                        name={`price_${item.itemKey}`}
                        className="form-control"
                        value={item.price}
                        onChange={(event) => handleItemChange(index, "price", event.target.value)}
                        disabled={item.contactForPrice}
                        placeholder={t("vendorDashboard.profilePricing.currencyPlaceholder")}
                      />
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`pricing-contact-${item.itemKey}`}
                          name={`contact_${item.itemKey}`}
                          checked={item.contactForPrice}
                          onChange={(event) => handleItemChange(index, "contactForPrice", event.target.checked)}
                        />
                        <label className="form-check-label" htmlFor={`pricing-contact-${item.itemKey}`}>
                          {t("vendorDashboard.profilePricing.contactForPrice")}
                        </label>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="row g-2">
                      <div className="col-12 col-md-6">
                        <label className="form-label" htmlFor={`pricing-notes-en-${item.itemKey}`}>
                          {t("vendorDashboard.profilePricing.notesEnLabel")}
                        </label>
                        <textarea
                          id={`pricing-notes-en-${item.itemKey}`}
                          className="form-control"
                          rows={2}
                          value={item.notesEn}
                          onChange={(event) => handleItemChange(index, "notesEn", event.target.value)}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label" htmlFor={`pricing-notes-es-${item.itemKey}`}>
                          {t("vendorDashboard.profilePricing.notesEsLabel")}
                        </label>
                        <textarea
                          id={`pricing-notes-es-${item.itemKey}`}
                          className="form-control"
                          rows={2}
                          value={item.notesEs}
                          onChange={(event) => handleItemChange(index, "notesEs", event.target.value)}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {state.message ? (
        <div className={`alert ${state.ok ? "alert-success" : "alert-danger"}`} role="status">
          {state.message}
        </div>
      ) : null}

      <button className="btn btn-primary" disabled={isPending}>
        {isPending
          ? t("vendorDashboard.profilePricing.saving")
          : t("vendorDashboard.profilePricing.save")}
      </button>
    </form>
  );
}

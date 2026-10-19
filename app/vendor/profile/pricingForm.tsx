"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getVendorPricingOrder,
  humanizeVendorFieldKey,
} from "@/lib/vendorServiceProfile";
import { useProfileAction } from "./useProfileAction";
import ProfileSaveBar from "./ProfileSaveBar";
import { savePricing, type FormMessageState } from "./actions";

type PricingItem = {
  itemKey: string;
  price: string;
  currency?: string;
  contactForPrice: boolean;
  notesEn: string;
  notesEs: string;
};
type PricingInitial = {
  items: PricingItem[];
  typicalSpend: string;
  typicalSpendCurrency: string;
  peakSeasons: string;
};
const initialState: FormMessageState = { ok: false, message: "" };

export default function PricingForm({
  initial,
  categoryKeys = [],
}: {
  initial: PricingInitial;
  categoryKeys?: string[];
}) {
  const { language, dictionary } = useLanguage();
  const es = language === "es";
  const [state, formAction, pending] = useProfileAction(
    savePricing,
    initialState,
  );
  const [items, setItems] = useState(initial.items);
  const [typicalSpend, setTypicalSpend] = useState(initial.typicalSpend);
  const [currency, setCurrency] = useState(
    initial.typicalSpendCurrency || "USD",
  );
  const [seasons, setSeasons] = useState(initial.peakSeasons);
  const [choice, setChoice] = useState("");
  const [customName, setCustomName] = useState("");
  const [notice, setNotice] = useState("");
  const [removed, setRemoved] = useState<{
    item: PricingItem;
    index: number;
  } | null>(null);
  const focusNew = useRef(false);
  const addButton = useRef<HTMLButtonElement>(null);
  const priceInputs = useRef<(HTMLInputElement | null)[]>([]);
  const labels = dictionary.vendorPublic.pricing.items as Record<
    string,
    string
  >;
  const label = (key: string) => labels[key] ?? humanizeVendorFieldKey(key);
  const suggestions = getVendorPricingOrder(categoryKeys).filter(
    (key) =>
      !items.some((item) => item.itemKey.toLowerCase() === key.toLowerCase()),
  );
  useEffect(() => {
    if (focusNew.current) {
      priceInputs.current[items.length - 1]?.focus();
      focusNew.current = false;
    }
  }, [items.length]);

  function addPackage() {
    const key =
      choice === "custom" || (!choice && !suggestions.length)
        ? customName.trim()
        : choice || suggestions[0];
    if (
      !key ||
      items.some((item) => item.itemKey.toLowerCase() === key.toLowerCase())
    ) {
      setNotice(
        es
          ? "Escribe un nombre diferente para este paquete."
          : "Give this package a unique name.",
      );
      return;
    }
    if (items.length >= 100) return;
    setItems((current) => [
      ...current,
      {
        itemKey: key,
        price: "",
        currency,
        contactForPrice: false,
        notesEn: "",
        notesEs: "",
      },
    ]);
    focusNew.current = true;
    setChoice("");
    setCustomName("");
    setNotice("");
  }
  function change(index: number, patch: Partial<PricingItem>) {
    setItems((current) =>
      current.map((item, position) =>
        position === index ? { ...item, ...patch } : item,
      ),
    );
  }
  return (
    <form
      action={formAction}
      data-profile-save
      onSubmit={(event) => {
        if (
          customName.trim() &&
          (choice === "custom" || (!choice && !suggestions.length))
        ) {
          event.preventDefault();
          addButton.current?.click();
        }
      }}
    >
      <input type="hidden" name="pricing_items" value={JSON.stringify(items)} />
      <div className="wm-profile-form-group">
        <h3>
          {es ? "Una idea del presupuesto" : "Give couples a starting point"}
        </h3>
        <p className="text-muted small">
          {es
            ? "Opcional. Una referencia del gasto ayuda a las parejas a encontrar opciones que encajen."
            : "Optional. A typical spend helps couples understand whether you’re a good fit."}
        </p>
        <div className="row g-3">
          <div className="col-sm-7">
            <label className="form-label" htmlFor="pricing-typical-spend">
              {es ? "Gasto típico" : "Typical spend"}
            </label>
            <input
              id="pricing-typical-spend"
              name="typical_spend"
              className="form-control"
              inputMode="decimal"
              placeholder="2500.00"
              value={typicalSpend}
              onChange={(event) => setTypicalSpend(event.target.value)}
            />
          </div>
          <div className="col-sm-5">
            <label className="form-label" htmlFor="pricing-currency">
              {es ? "Moneda predeterminada" : "Default currency"}
            </label>
            <input
              id="pricing-currency"
              name="typical_currency"
              className="form-control"
              maxLength={3}
              pattern="[A-Za-z]{3}"
              required
              value={currency}
              onChange={(event) =>
                setCurrency(event.target.value.toUpperCase())
              }
            />
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor="pricing-seasons">
              {es ? "Temporadas altas (opcional)" : "Peak seasons (optional)"}
            </label>
            <input
              id="pricing-seasons"
              name="peak_seasons"
              className="form-control"
              placeholder={
                es ? "Diciembre, enero, febrero" : "December, January, February"
              }
              value={seasons}
              onChange={(event) => setSeasons(event.target.value)}
            />
            <p className="form-text">
              {es
                ? "Separa las temporadas con comas."
                : "Separate seasons with commas."}
            </p>
          </div>
        </div>
      </div>
      <div className="wm-profile-section-title">
        <div>
          <h3>
            {es ? "Tus servicios y paquetes" : "Your services & packages"}
          </h3>
          <p>
            {es
              ? "Empieza con uno. Describe qué incluye para facilitar la comparación."
              : "Start with one. Describe what’s included to make comparing easier."}
          </p>
        </div>
        <span>{items.length}/100</span>
      </div>
      {removed ? (
        <div className="wm-profile-undo" role="status">
          {es
            ? "Paquete retirado del borrador."
            : "Package removed from this draft."}{" "}
          <button
            type="button"
            data-profile-change
            onClick={() => {
              setItems((current) => {
                if (
                  current.some(
                    (item) =>
                      item.itemKey.toLowerCase() ===
                      removed.item.itemKey.toLowerCase(),
                  )
                )
                  return current;
                const next = [...current];
                next.splice(removed.index, 0, removed.item);
                return next;
              });
              setRemoved(null);
            }}
          >
            {es ? "Deshacer" : "Undo"}
          </button>
        </div>
      ) : null}
      {items.length === 0 ? (
        <div className="wm-profile-empty">
          <span aria-hidden="true">＋</span>
          <h4>
            {es
              ? "¿Qué pueden contratar las parejas?"
              : "What can couples book with you?"}
          </h4>
          <p>
            {es
              ? "Añade un servicio recomendado o crea tu propio paquete abajo."
              : "Add a suggested service or create your own package below."}
          </p>
        </div>
      ) : null}
      <div className="wm-profile-package-list">
        {items.map((item, index) => (
          <article className="wm-profile-package" key={item.itemKey}>
            <div className="wm-profile-package__header">
              <div>
                <span className="wm-profile-eyebrow">
                  {es ? "PAQUETE" : "PACKAGE"}{" "}
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h4>{label(item.itemKey)}</h4>
              </div>
              <button
                type="button"
                className="btn btn-link text-danger btn-sm"
                data-profile-change
                aria-label={`${es ? "Quitar" : "Remove"} ${label(item.itemKey)}`}
                onClick={() => {
                  setRemoved({ item, index });
                  setItems((current) =>
                    current.filter((_, position) => position !== index),
                  );
                }}
              >
                {es ? "Quitar" : "Remove"}
              </button>
            </div>
            <div className="row g-3">
              <div className="col-sm-7">
                <label
                  className="form-label"
                  htmlFor={`package-price-${index}`}
                >
                  {es ? "Precio" : "Price"}
                </label>
                <input
                  ref={(element) => {
                    priceInputs.current[index] = element;
                  }}
                  id={`package-price-${index}`}
                  className="form-control"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={item.price}
                  disabled={item.contactForPrice}
                  required={!item.contactForPrice}
                  onChange={(event) =>
                    change(index, { price: event.target.value })
                  }
                />
              </div>
              <div className="col-sm-5">
                <label
                  className="form-label"
                  htmlFor={`package-currency-${index}`}
                >
                  {es ? "Moneda" : "Currency"}
                </label>
                <input
                  id={`package-currency-${index}`}
                  className="form-control"
                  value={item.currency ?? currency}
                  maxLength={3}
                  pattern="[A-Za-z]{3}"
                  required
                  onChange={(event) =>
                    change(index, {
                      currency: event.target.value.toUpperCase(),
                    })
                  }
                />
              </div>
              <div className="col-12">
                <div className="form-check">
                  <input
                    id={`package-quote-${index}`}
                    className="form-check-input"
                    type="checkbox"
                    checked={item.contactForPrice}
                    onChange={(event) =>
                      change(index, { contactForPrice: event.target.checked })
                    }
                  />
                  <label
                    className="form-check-label"
                    htmlFor={`package-quote-${index}`}
                  >
                    {es
                      ? "Prefiero dar una cotización personalizada"
                      : "I prefer to give a custom quote"}
                  </label>
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor={`package-en-${index}`}>
                  {es ? "Qué incluye · Inglés" : "What’s included · English"}
                </label>
                <textarea
                  id={`package-en-${index}`}
                  className="form-control"
                  rows={3}
                  value={item.notesEn}
                  onChange={(event) =>
                    change(index, { notesEn: event.target.value })
                  }
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor={`package-es-${index}`}>
                  {es ? "Qué incluye · Español" : "What’s included · Spanish"}
                </label>
                <textarea
                  id={`package-es-${index}`}
                  className="form-control"
                  rows={3}
                  value={item.notesEs}
                  onChange={(event) =>
                    change(index, { notesEs: event.target.value })
                  }
                />
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="wm-profile-add">
        <h4>{es ? "Añadir un paquete" : "Add a package"}</h4>
        <div className="d-flex flex-wrap gap-2 align-items-end">
          <div className="flex-grow-1">
            <label className="form-label" htmlFor="package-suggestion">
              {es ? "Servicio" : "Service"}
            </label>
            <select
              data-profile-ignore
              id="package-suggestion"
              className="form-select"
              value={choice || (suggestions[0] ?? "custom")}
              onChange={(event) => setChoice(event.target.value)}
            >
              {suggestions.map((key) => (
                <option key={key} value={key}>
                  {label(key)}
                </option>
              ))}
              <option value="custom">
                {es ? "Crear mi propio paquete…" : "Create my own package…"}
              </option>
            </select>
          </div>
          <button
            type="button"
            className="btn btn-outline-dark"
            disabled={items.length >= 100}
            data-profile-change
            ref={addButton}
            onClick={addPackage}
          >
            + {es ? "Añadir paquete" : "Add package"}
          </button>
        </div>
        {choice === "custom" || (!choice && !suggestions.length) ? (
          <div className="mt-3">
            <label className="form-label" htmlFor="package-name">
              {es ? "Nombre del paquete" : "Package name"}
            </label>
            <input
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addButton.current?.click();
                }
              }}
              id="package-name"
              className="form-control"
              maxLength={120}
              placeholder={
                es
                  ? "Por ejemplo: Boda íntima"
                  : "For example: Intimate wedding"
              }
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
            />
          </div>
        ) : null}
        {notice ? (
          <p className="text-danger small mt-2" role="alert">
            {notice}
          </p>
        ) : null}
        <p className="form-text mb-0">
          {es
            ? "Guarda esta sección para aplicar los cambios a tus paquetes."
            : "Packages and changes are applied when you save this section."}
        </p>
      </div>
      <ProfileSaveBar state={state} pending={pending} />
    </form>
  );
}

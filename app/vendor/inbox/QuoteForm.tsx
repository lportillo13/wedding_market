"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslation } from "@/contexts/LanguageContext";
import { sendQuote, type SendQuoteState } from "./actions";

export default function QuoteForm({ rfq_id, vendor_id }: { rfq_id: string; vendor_id: string }) {
  const [state, action, pending] = useActionState<SendQuoteState, FormData>(sendQuote, { ok: false });
  const prevOk = useRef(state.ok);
  const formRef = useRef<HTMLFormElement>(null);
  const t = useTranslation();

  // On successful submit, clear fields
  useEffect(() => {
    if (!prevOk.current && state.ok) {
      formRef.current?.reset();
    }
    prevOk.current = state.ok;
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="row g-2 align-items-end">
      <input type="hidden" name="rfq_id" value={rfq_id} />
      <input type="hidden" name="vendor_id" value={vendor_id} />

      <div className="col-md-3">
        <label className="form-label" htmlFor="quote-amount-usd">
          {t("vendorInbox.quoteForm.amountLabel")}
        </label>
        <input
          id="quote-amount-usd"
          className="form-control"
          name="amount_usd"
          inputMode="decimal"
          placeholder={t("vendorInbox.quoteForm.amountPlaceholder")}
          required
        />
      </div>

      <div className="col-md-7">
        <label className="form-label" htmlFor="quote-message">
          {t("vendorInbox.quoteForm.messageLabel")}
        </label>
        <input
          id="quote-message"
          className="form-control"
          name="message"
          placeholder={t("vendorInbox.quoteForm.messagePlaceholder")}
        />
      </div>

      <div className="col-md-2 d-grid">
        <button className="btn btn-success" disabled={pending}>
          {pending ? t("vendorInbox.quoteForm.submitting") : t("vendorInbox.quoteForm.submit")}
        </button>
      </div>

      {!state.ok && state.message && (
        <div className="col-12">
          <div className="alert alert-danger my-2">{state.message}</div>
        </div>
      )}
      {state.ok && (
        <div className="col-12">
          <div className="alert alert-success my-2">{t("vendorInbox.quoteForm.success")}</div>
        </div>
      )}
    </form>
  );
}

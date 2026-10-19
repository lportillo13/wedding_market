"use client";

import { useActionState, useState } from "react";
import { useTranslation } from "@/contexts/LanguageContext";
import { sendQuote, type SendQuoteState } from "./actions";

type QuoteFormProps = {
  rfq_id: string;
  vendor_id: string;
  initialAmountUsd?: string;
  initialMessage?: string | null;
};

export default function QuoteForm({
  rfq_id,
  vendor_id,
  initialAmountUsd = "",
  initialMessage = "",
}: QuoteFormProps) {
  const [state, action, pending] = useActionState<SendQuoteState, FormData>(sendQuote, { ok: false });
  const [amount, setAmount] = useState(initialAmountUsd);
  const [message, setMessage] = useState(initialMessage ?? "");
  const t = useTranslation();

  return (
    <form action={action} className="row g-2 align-items-end">
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
          value={amount}
          onChange={event => setAmount(event.target.value)}
          readOnly={pending}
          required
        />
      </div>

      <div className="col-md-7">
        <label className="form-label" htmlFor="quote-message">
          {t("vendorInbox.quoteForm.messageLabel")}
        </label>
        <textarea
          id="quote-message"
          className="form-control"
          name="message"
          rows={3}
          maxLength={2000}
          placeholder={t("vendorInbox.quoteForm.messagePlaceholder")}
          value={message}
          onChange={event => setMessage(event.target.value)}
          readOnly={pending}
        />
      </div>

      <div className="col-md-2 d-grid">
        <button className="btn btn-success" disabled={pending}>
          {pending ? t("vendorInbox.quoteForm.submitting") : t("vendorInbox.quoteForm.submit")}
        </button>
      </div>

      {!state.ok && state.message && (
        <div className="col-12">
          <div className="alert alert-danger my-2" role="alert">{state.message}</div>
        </div>
      )}
      {state.ok && (
        <div className="col-12">
          <div className="alert alert-success my-2" role="status">{t("vendorInbox.quoteForm.success")}</div>
        </div>
      )}
    </form>
  );
}

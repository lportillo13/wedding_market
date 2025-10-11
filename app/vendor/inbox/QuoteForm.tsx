"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendQuote, type SendQuoteState } from "./actions";

export default function QuoteForm({ rfq_id, vendor_id }: { rfq_id: string; vendor_id: string }) {
  const [state, action, pending] = useActionState<SendQuoteState, FormData>(sendQuote, { ok: false });
  const prevOk = useRef(state.ok);
  const formRef = useRef<HTMLFormElement>(null);

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
        <label className="form-label" htmlFor="quote-amount-usd">Quote (USD)</label>
        <input
          id="quote-amount-usd"
          className="form-control"
          name="amount_usd"
          inputMode="decimal"
          placeholder="e.g. 2500"
          required
        />
      </div>

      <div className="col-md-7">
        <label className="form-label" htmlFor="quote-message">Message</label>
        <input
          id="quote-message"
          className="form-control"
          name="message"
          placeholder="What’s included, availability, next steps…"
        />
      </div>

      <div className="col-md-2 d-grid">
        <button className="btn btn-success" disabled={pending}>
          {pending ? "Sending…" : "Send quote"}
        </button>
      </div>

      {!state.ok && state.message && (
        <div className="col-12">
          <div className="alert alert-danger my-2">{state.message}</div>
        </div>
      )}
      {state.ok && (
        <div className="col-12">
          <div className="alert alert-success my-2">Quote sent ✅</div>
        </div>
      )}
    </form>
  );
}

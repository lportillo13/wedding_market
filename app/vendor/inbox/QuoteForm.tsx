"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendQuote, type SendQuoteState } from "./actions";

export default function QuoteForm({ rfq_id, vendor_id }: { rfq_id: string; vendor_id: string }) {
  const [state, action, pending] = useActionState<SendQuoteState, FormData>(sendQuote, { ok: false });
  const [amount, setAmount] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const prevOk = useRef(state.ok);

  // On successful submit, clear fields
  useEffect(() => {
    if (!prevOk.current && state.ok) {
      setAmount("");
      setMessage("");
    }
    prevOk.current = state.ok;
  }, [state.ok]);

  return (
    <form action={action} className="row g-2 align-items-end">
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
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
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
          value={message}
          onChange={(e) => setMessage(e.target.value)}
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

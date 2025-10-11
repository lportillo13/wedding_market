"use client";
import { useActionState, useState } from "react";
import { acceptQuote } from "./actions";

export default function AcceptButton({ rfq_id, quote_id }: { rfq_id: string; quote_id: string }) {
  const [state, action, pending] = useActionState(acceptQuote, { ok: false });
  const [revealEmail, setRevealEmail] = useState(true);
  const [revealPhone, setRevealPhone] = useState(false);

  return (
    <form action={action} className="vstack gap-2">
      <input type="hidden" name="rfq_id" value={rfq_id} />
      <input type="hidden" name="quote_id" value={quote_id} />

      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          id={`reveal_email_${quote_id}`}
          name="reveal_email"
          checked={revealEmail}
          onChange={(e) => setRevealEmail(e.target.checked)}
        />
        <label className="form-check-label" htmlFor={`reveal_email_${quote_id}`}>
          Reveal my email
        </label>
      </div>

      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          id={`reveal_phone_${quote_id}`}
          name="reveal_phone"
          checked={revealPhone}
          onChange={(e) => setRevealPhone(e.target.checked)}
        />
        <label className="form-check-label" htmlFor={`reveal_phone_${quote_id}`}>
          Reveal my phone
        </label>
      </div>

      <button className="btn btn-success btn-sm align-self-start" disabled={pending}>
        {pending ? "Accepting…" : "Accept quote"}
      </button>

      {!state.ok && state.message && <div className="small text-danger">{state.message}</div>}
    </form>
  );
}

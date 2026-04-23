"use client";

import { useActionState, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { acceptQuote } from "./actions";

export default function AcceptButton({ rfq_id, quote_id }: { rfq_id: string; quote_id: string }) {
  const [state, action, pending] = useActionState(acceptQuote, { ok: false });
  const [revealEmail, setRevealEmail] = useState(true);
  const [revealPhone, setRevealPhone] = useState(false);
  const { dictionary } = useLanguage();
  const labels = dictionary.account.rfqsPage.acceptQuote;

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
          onChange={(event) => setRevealEmail(event.target.checked)}
        />
        <label className="form-check-label" htmlFor={`reveal_email_${quote_id}`}>
          {labels.shareEmail}
        </label>
      </div>

      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          id={`reveal_phone_${quote_id}`}
          name="reveal_phone"
          checked={revealPhone}
          onChange={(event) => setRevealPhone(event.target.checked)}
        />
        <label className="form-check-label" htmlFor={`reveal_phone_${quote_id}`}>
          {labels.sharePhone}
        </label>
      </div>

      <button className="btn btn-success btn-sm align-self-start" disabled={pending}>
        {pending ? labels.submitting : labels.submit}
      </button>

      {!state.ok && state.message && <div className="small text-danger">{state.message}</div>}
    </form>
  );
}

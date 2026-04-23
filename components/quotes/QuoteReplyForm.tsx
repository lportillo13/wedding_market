"use client";

import { useActionState, useEffect, useRef } from "react";
import type { QuoteReplyState } from "@/app/quote-replies/actions";

type QuoteReplyFormProps = {
  action: (state: QuoteReplyState, formData: FormData) => Promise<QuoteReplyState>;
  quoteId: string;
  rfqId: string;
  vendorId: string;
  submitLabel: string;
  submittingLabel: string;
  placeholder: string;
  successLabel: string;
};

export default function QuoteReplyForm({
  action,
  quoteId,
  rfqId,
  vendorId,
  submitLabel,
  submittingLabel,
  placeholder,
  successLabel,
}: QuoteReplyFormProps) {
  const [state, formAction, pending] = useActionState<QuoteReplyState, FormData>(action, { ok: false });
  const formRef = useRef<HTMLFormElement>(null);
  const previousOk = useRef(state.ok);

  useEffect(() => {
    if (state.ok && !previousOk.current) {
      formRef.current?.reset();
    }
    previousOk.current = state.ok;
  }, [state.ok]);

  return (
    <form ref={formRef} action={formAction} className="mt-3">
      <input type="hidden" name="quote_id" value={quoteId} />
      <input type="hidden" name="rfq_id" value={rfqId} />
      <input type="hidden" name="vendor_id" value={vendorId} />
      <div className="mb-2">
        <textarea
          className="form-control"
          name="body"
          rows={3}
          placeholder={placeholder}
          required
        />
      </div>
      <div className="d-flex gap-2 align-items-center">
        <button className="btn btn-outline-primary btn-sm" disabled={pending}>
          {pending ? submittingLabel : submitLabel}
        </button>
        {state.ok ? <span className="small text-success">{successLabel}</span> : null}
      </div>
      {!state.ok && state.message ? <div className="alert alert-danger mt-2 mb-0">{state.message}</div> : null}
    </form>
  );
}

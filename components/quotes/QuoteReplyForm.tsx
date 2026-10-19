"use client";
import { useActionState, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { QuoteReplyState } from "@/app/quote-replies/actions";

type Props = {
  action: (state: QuoteReplyState, form: FormData) => Promise<QuoteReplyState>;
  quoteId?: string | null;
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
}: Props) {
  const { language } = useLanguage();
  const [body, setBody] = useState("");
  const messageId = useRef<string | null>(null);
  const attemptedBody = useRef("");
  const [state, formAction, pending] = useActionState<
    QuoteReplyState,
    FormData
  >(
    async (previous, form) => {
      // Keep the same ID on an ambiguous network retry; a changed draft is a new send.
      const submittedBody = String(form.get("body") || "").trim();
      if (!messageId.current || attemptedBody.current !== submittedBody)
        messageId.current = crypto.randomUUID();
      attemptedBody.current = submittedBody;
      form.set("client_message_id", messageId.current);
      try {
        const result = await action(previous, form);
        if (result.ok) {
          setBody("");
          messageId.current = null;
        }
        return result;
      } catch {
        return {
          ok: false,
          message:
            language === "es"
              ? "No se pudo enviar. Tu mensaje se conserva; inténtalo de nuevo."
              : "Unable to send. Your draft is saved here; try again.",
        };
      }
    },
    { ok: false },
  );
  return (
    <form action={formAction} className="mt-3" aria-busy={pending}>
      <input type="hidden" name="quote_id" value={quoteId ?? ""} />
      <input type="hidden" name="rfq_id" value={rfqId} />
      <input type="hidden" name="vendor_id" value={vendorId} />
      <div className="mb-2">
        <textarea
          className="form-control"
          name="body"
          rows={3}
          maxLength={2000}
          placeholder={placeholder}
          aria-label={placeholder}
          required
          readOnly={pending}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <div className="form-text text-end">{body.length}/2000</div>
      </div>
      <div className="d-flex gap-2 align-items-center">
        <button
          className="btn btn-outline-primary"
          disabled={pending || !body.trim()}
        >
          {pending ? submittingLabel : submitLabel}
        </button>
        {state.ok && !body ? (
          <span className="small text-success" role="status">
            {successLabel}
          </span>
        ) : null}
      </div>
      {!state.ok && state.message ? (
        <div className="alert alert-danger mt-2 mb-0" role="alert">
          {state.message}
        </div>
      ) : null}
    </form>
  );
}

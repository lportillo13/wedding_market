"use client";

import { useActionState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CreateReviewState } from "@/app/account/reviews/actions";

type ReviewFormProps = {
  rfq_id: string;
  vendor_id: string;
  action: (prev: CreateReviewState, fd: FormData) => Promise<CreateReviewState>;
};

const initialState: CreateReviewState = { ok: true };

export default function ReviewForm({ rfq_id, vendor_id, action }: ReviewFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const errorMessage = state.ok ? null : state.error;
  const { dictionary } = useLanguage();
  const labels = dictionary.account.reviewForm;

  return (
    <form action={formAction} className="vstack gap-3">
      <input type="hidden" name="rfq_id" value={rfq_id} />
      <input type="hidden" name="vendor_id" value={vendor_id} />

      <div>
        <label htmlFor="rating" className="form-label">
          {labels.ratingLabel}
        </label>
        <select id="rating" name="rating" className="form-select" required defaultValue="5">
          {[5, 4, 3, 2, 1].map((rating) => (
            <option key={rating} value={rating}>
              {rating}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="title" className="form-label">
          {labels.titleLabel}
        </label>
        <input id="title" name="title" className="form-control" maxLength={120} />
      </div>

      <div>
        <label htmlFor="body" className="form-label">
          {labels.bodyLabel}
        </label>
        <textarea id="body" name="body" className="form-control" maxLength={800} rows={5} />
      </div>

      {errorMessage ? <div className="alert alert-danger">{errorMessage}</div> : null}

      <button className="btn btn-primary" disabled={pending} type="submit">
        {pending ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}

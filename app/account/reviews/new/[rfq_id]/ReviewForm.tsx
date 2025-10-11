'use client';

import { useActionState } from 'react';
import type { CreateReviewState } from '@/app/account/reviews/actions';

type ReviewFormProps = {
  rfq_id: string;
  vendor_id: string;
  action: (prev: CreateReviewState, fd: FormData) => Promise<CreateReviewState>;
};

const initialState: CreateReviewState = { ok: true };

export default function ReviewForm({ rfq_id, vendor_id, action }: ReviewFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const errorMessage = state.ok ? null : state.error;

  return (
    <form action={formAction} className="vstack gap-3">
      <input type="hidden" name="rfq_id" value={rfq_id} />
      <input type="hidden" name="vendor_id" value={vendor_id} />

      <div>
        <label htmlFor="rating" className="form-label">
          Rating
        </label>
        <select id="rating" name="rating" className="form-select" required defaultValue="5">
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="title" className="form-label">
          Title
        </label>
        <input id="title" name="title" className="form-control" maxLength={120} />
      </div>

      <div>
        <label htmlFor="body" className="form-label">
          Review
        </label>
        <textarea id="body" name="body" className="form-control" maxLength={800} rows={5} />
      </div>

      {errorMessage ? <div className="alert alert-danger">{errorMessage}</div> : null}

      <button className="btn btn-primary" disabled={pending} type="submit">
        Submit review
      </button>
    </form>
  );
}

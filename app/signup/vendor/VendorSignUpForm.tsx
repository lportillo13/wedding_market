'use client';

import { useActionState } from 'react';
import { createVendor, type VendorSignUpState } from './actions';

const initialState: VendorSignUpState = { ok: false };

export default function VendorSignUpForm() {
  const [state, action, pending] = useActionState(createVendor, initialState);

  return (
    <form action={action} className="border rounded p-4 bg-body">
      <div className="mb-3">
        <label className="form-label" htmlFor="vendor-name">
          Business name
        </label>
        <input id="vendor-name" className="form-control" name="business_name" required minLength={2} />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="vendor-city">
          City
        </label>
        <input id="vendor-city" className="form-control" name="city" />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="vendor-country">
          Country
        </label>
        <input id="vendor-country" className="form-control" name="country" />
      </div>
      {state.message && <div className="alert alert-danger">{state.message}</div>}
      <button className="btn btn-primary w-100" disabled={pending}>
        {pending ? 'Creating…' : 'Create vendor profile'}
      </button>
    </form>
  );
}

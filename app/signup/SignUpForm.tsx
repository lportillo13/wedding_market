'use client';

import { useActionState } from 'react';
import { signUp, type SignUpState } from './actions';

const initialState: SignUpState = { ok: false };

export default function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, initialState);

  return (
    <form action={action} className="border rounded p-4 bg-body">
      <div className="mb-3">
        <label className="form-label" htmlFor="signup-email">
          Email
        </label>
        <input id="signup-email" className="form-control" type="email" name="email" required />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="signup-password">
          Password
        </label>
        <input id="signup-password" className="form-control" type="password" name="password" required minLength={6} />
        <div className="form-text">At least 6 characters.</div>
      </div>
      {state.message && <div className="alert alert-danger">{state.message}</div>}
      <button className="btn btn-primary w-100" disabled={pending}>
        {pending ? 'Signing up…' : 'Create account'}
      </button>
    </form>
  );
}

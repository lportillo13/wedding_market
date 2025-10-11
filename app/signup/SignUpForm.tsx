'use client';

import { useActionState } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { signUp, type SignUpState } from './actions';

const initialState: SignUpState = { ok: false };

export default function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, initialState);
  const t = useTranslation();

  return (
    <form action={action} className="border rounded p-4 bg-body">
      <div className="mb-3">
        <label className="form-label" htmlFor="signup-email">
          {t('signup.form.emailLabel')}
        </label>
        <input id="signup-email" className="form-control" type="email" name="email" required />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="signup-password">
          {t('signup.form.passwordLabel')}
        </label>
        <input id="signup-password" className="form-control" type="password" name="password" required minLength={6} />
        <div className="form-text">{t('signup.form.passwordHelp')}</div>
      </div>
      {state.message && <div className="alert alert-danger">{state.message}</div>}
      <button className="btn btn-primary w-100" disabled={pending}>
        {pending ? t('signup.form.submitting') : t('signup.form.submit')}
      </button>
    </form>
  );
}

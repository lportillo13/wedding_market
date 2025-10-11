'use client';

import { useActionState } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { createVendor, type VendorSignUpState } from './actions';

const initialState: VendorSignUpState = { ok: false };

export default function VendorSignUpForm() {
  const [state, action, pending] = useActionState(createVendor, initialState);
  const t = useTranslation();

  return (
    <form action={action} className="border rounded p-4 bg-body">
      <div className="mb-3">
        <label className="form-label" htmlFor="vendor-name">
          {t('signup.vendor.form.businessNameLabel')}
        </label>
        <input id="vendor-name" className="form-control" name="business_name" required minLength={2} />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="vendor-city">
          {t('signup.vendor.form.cityLabel')}
        </label>
        <input id="vendor-city" className="form-control" name="city" />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="vendor-country">
          {t('signup.vendor.form.countryLabel')}
        </label>
        <input id="vendor-country" className="form-control" name="country" />
      </div>
      {state.message && <div className="alert alert-danger">{state.message}</div>}
      <button className="btn btn-primary w-100" disabled={pending}>
        {pending ? t('signup.vendor.form.submitting') : t('signup.vendor.form.submit')}
      </button>
    </form>
  );
}

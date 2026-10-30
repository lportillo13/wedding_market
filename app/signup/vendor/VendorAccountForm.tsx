'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import PasswordInput from '@/components/PasswordInput';
import JourneyProgress from '@/components/auth/JourneyProgress';
import { createVendorSignupAccount, type VendorAccountState } from './account-actions';
import { vendorOnboardingCopy } from './presentation';

const initialState: VendorAccountState = { ok: false };

export default function VendorAccountForm() {
  const { dictionary, language } = useLanguage();
  const copy = dictionary.signup.journey;
  const [state, action, pending] = useActionState(createVendorSignupAccount, initialState);
  const [details, setDetails] = useState({ name: '', email: '', password: '' });
  const inFlight = useRef(false);
  const busy = pending || state.ok;
  useEffect(() => { if (state.ok) window.location.replace(state.redirectTo); if (!pending) inFlight.current = false; }, [state, pending]);
  return <form action={action} className="wm-auth-journey" aria-busy={busy} onSubmit={event => { if (inFlight.current || busy) event.preventDefault(); else inFlight.current = true; }}>
    <JourneyProgress steps={[copy.account, copy.confirmEmail, copy.vendorProfileLabel]} current={0} label={copy.stageLabel} />
    <header className="wm-auth-editorial__heading"><p className="wm-auth-editorial__eyebrow">{vendorOnboardingCopy[language].eyebrow}</p><h1>{copy.vendorAccountTitle}</h1><p>{copy.vendorAccountNote}</p></header>
    {!state.ok && state.feedback && <div className="wm-auth-error" role="alert">{dictionary.login.feedback[state.feedback]}</div>}
    <fieldset disabled={busy} className="wm-auth-journey__panel wm-auth-journey__panels">
      <label className="form-label" htmlFor="vendor-owner-name">{dictionary.signup.vendor.form.fields.ownerNameLabel}</label>
      <input id="vendor-owner-name" className="form-control" name="owner_name" autoComplete="name" required maxLength={200} value={details.name} onChange={e => setDetails(current => ({ ...current, name: e.target.value }))} />
      <label className="form-label" htmlFor="vendor-owner-email">{dictionary.signup.form.emailLabel}</label>
      <input id="vendor-owner-email" className="form-control" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required value={details.email} onChange={e => setDetails(current => ({ ...current, email: e.target.value }))} />
      <label className="form-label" htmlFor="vendor-owner-password">{dictionary.signup.form.passwordLabel}</label>
      <PasswordInput id="vendor-owner-password" className="form-control" name="password" autoComplete="new-password" minLength={8} required value={details.password} onChange={e => setDetails(current => ({ ...current, password: e.target.value }))} />
      <p className="form-text">{copy.passwordHint}</p>
      <input type="hidden" name="account_language" value={language} />
    </fieldset>
    <p className="wm-auth-journey__note">{dictionary.login.editorial.free}</p>
    <footer className="wm-auth-journey__actions"><button className="btn btn-primary" type="submit" disabled={busy}>{busy ? dictionary.signup.form.submitting : copy.vendorAccountButton}</button></footer>
    <div className="wm-auth-journey__links"><p>{copy.alreadyAccount} <Link href="/login?next=%2Fsignup%2Fvendor">{dictionary.login.editorial.submit}</Link></p><p>{copy.switchCouple} <Link href="/signup">{dictionary.login.editorial.coupleSignup}</Link></p></div>
  </form>;
}

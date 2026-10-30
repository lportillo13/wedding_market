'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import EditorialAuthLayout from '@/components/auth/EditorialAuthLayout';
import JourneyProgress from '@/components/auth/JourneyProgress';
import { supabaseBrowser } from '@/lib/supabase/client';
import { authFeedbackKey } from '@/lib/auth-feedback';

export default function CheckEmailClient({ vendor, initialLanguage }: { vendor: boolean; initialLanguage?: 'en' | 'es' }) {
  const { dictionary, setLanguage } = useLanguage();
  const copy = dictionary.signup.journey;
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [feedback, setFeedback] = useState<ReturnType<typeof authFeedbackKey> | null>(null);
  const inFlight = useRef(false);
  useEffect(() => { if (initialLanguage) setLanguage(initialLanguage); }, [initialLanguage, setLanguage]);
  async function resend(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true; setPending(true); setFeedback(null); setSent(false);
    try {
      const next = vendor ? '/signup/vendor' : '/account/profile';
      const { error } = await supabaseBrowser.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: location.origin + '/auth/callback?next=' + encodeURIComponent(next) } });
      if (error) throw error;
      setSent(true);
    } catch (error) { setFeedback(authFeedbackKey(error)); }
    finally { setPending(false); inFlight.current = false; }
  }
  return <EditorialAuthLayout onboarding vendor={vendor}>
    <div className="wm-auth-journey wm-auth-journey--confirmation">
      {vendor && <JourneyProgress steps={[copy.account, copy.confirmEmail, copy.vendorProfileLabel]} current={1} label={copy.stageLabel} />}
      <header className="wm-auth-editorial__heading"><p className="wm-auth-editorial__eyebrow">{copy.confirmEmail}</p><h1>{copy.verifyTitle}</h1><p>{copy.verifyBody}</p></header>
      <div className="wm-auth-journey__mail" aria-hidden="true"><svg width="64" height="48" viewBox="0 0 64 48" fill="none"><rect x="1" y="1" width="62" height="46" rx="2" stroke="currentColor"/><path d="m2 2 30 25L62 2M2 46l20-19m40 19L42 27" stroke="currentColor"/></svg></div>
      <p className="wm-auth-journey__note">{vendor ? copy.vendorVerifyBody : copy.coupleVerifyBody}</p>
      <Link className="wm-auth-btn" href={vendor ? '/login?next=%2Fsignup%2Fvendor' : '/login'}>{vendor ? copy.verifyNext : dictionary.login.editorial.submit}</Link>
      <p className="wm-auth-journey__note">{copy.confirmationHelp} <Link href={vendor ? '/forgot-password?next=%2Fsignup%2Fvendor' : '/forgot-password'}>{copy.recoverAccess}</Link></p>
      <details className="wm-auth-journey__resend"><summary>{copy.resend}</summary>
        <form onSubmit={resend} aria-busy={pending}>
          <label className="form-label" htmlFor="confirmation-email">{dictionary.login.emailLabel}</label>
          <input id="confirmation-email" className="form-control" type="email" name="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required value={email} onChange={e => setEmail(e.target.value)} disabled={pending} />
          <button className="wm-auth-btn wm-auth-btn--ghost" type="submit" disabled={pending}>{pending ? copy.resendPending : copy.resendButton}</button>
        </form>
      </details>
      {sent && <div className="wm-auth-success" role="status">{copy.resendSent}</div>}
      {feedback && <div className="wm-auth-error" role="alert">{dictionary.login.feedback[feedback]}</div>}
    </div>
  </EditorialAuthLayout>;
}

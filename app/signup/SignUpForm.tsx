'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef, useState, type FormEvent } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import PasswordInput from '@/components/PasswordInput';
import JourneyProgress from '@/components/auth/JourneyProgress';
import { buildCountryOptions } from '@/lib/countries';
import { authFeedbackKey } from '@/lib/auth-feedback';
import { coupleSignupIssue, coupleSignupPayload, type CoupleOnboardingData } from '@/features/auth/domain/couple-onboarding';
import { signUp, type SignUpState } from './actions';

type WeddingThemeValue = 'classic' | 'boho' | 'modern' | 'garden' | 'beach' | 'rustic' | 'vintage';

const weddingStyleCards: Array<{ value: WeddingThemeValue; image: string }> = [
  {
    value: 'classic',
    image: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=700&q=80',
  },
  {
    value: 'boho',
    image: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=700&q=80',
  },
  {
    value: 'modern',
    image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=700&q=80',
  },
  {
    value: 'garden',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=700&q=80',
  },
  {
    value: 'beach',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80',
  },
  {
    value: 'rustic',
    image: 'https://images.unsplash.com/photo-1505944357431-27579db47558?auto=format&fit=crop&w=700&q=80',
  },
  {
    value: 'vintage',
    image: 'https://images.unsplash.com/photo-1509610973147-232dfea52a97?auto=format&fit=crop&w=700&q=80',
  },
];


const initialState: SignUpState = { ok: false };

export default function SignUpForm({ closeHref = '/login' }: { closeHref?: string }) {
  const { dictionary, language } = useLanguage();
  const labels = dictionary.signup.form;
  const modal = labels.modal;
  const copy = dictionary.signup.journey;
  const [step, setStep] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [form, setForm] = useState<CoupleOnboardingData>({
    full_name: '', email: '', password: '', phone: '', country: '',
    wedding_theme: '', tentative_wedding_date: '', guest_count: '', wedding_budget: '',
  });
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const exitRef = useRef<HTMLDialogElement>(null);
  const inFlight = useRef(false);
  const [state, action, pending] = useActionState(async (previous: SignUpState, data: FormData): Promise<SignUpState> => {
    // React submits the complete state, even if a future layout unmounts a panel.
    for (const [name, value] of Object.entries(coupleSignupPayload(form, language))) data.set(name, value);
    try { return await signUp(previous, data); }
    catch (error) { return { ok: false, feedback: authFeedbackKey(error) }; }
  }, initialState);
  const busy = pending || state.ok;
  const steps = [copy.account, copy.contact, copy.style, copy.date, copy.details, copy.review];
  const titles = [copy.accountTitle, copy.contactTitle, modal.style.title, modal.date.title, copy.extrasTitle, copy.reviewTitle];
  const bodies = [copy.accountBody, copy.contactBody, modal.style.body, modal.date.body, copy.extrasBody, copy.reviewBody];
  const themeLabels = dictionary.account.profile.form.weddingTheme.options;
  const locale = language === 'es' ? 'es-CR' : 'en-US';
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month);
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const calendarDays = [...Array.from({ length: month.getDay() }, () => 0), ...Array.from({ length: dayCount }, (_, i) => i + 1)];
  const selectedDate = form.tentative_wedding_date
    ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(form.tentative_wedding_date + 'T12:00:00')) : copy.notAdded;
  const errorMessage = localError ?? (!state.ok ? state.feedback ? dictionary.login.feedback[state.feedback] : state.message : null);

  useEffect(() => {
    if (state.ok) window.location.replace(state.redirectTo);
    if (!pending) inFlight.current = false;
  }, [state, pending]);

  function changeStep(nextStep: number) {
    setStep(nextStep);
    setLocalError(null);
    requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true });
      formRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  }
  function update(name: keyof CoupleOnboardingData, value: string) {
    setLocalError(null);
    setForm(current => ({ ...current, [name]: value }));
  }
  function validate(index: number) {
    const issue = coupleSignupIssue(form, index);
    if (issue) {
      const messages = { ...labels.validation, phoneRequired: modal.phoneRequired, styleRequired: modal.styleRequired,
        invalidGuestCount: dictionary.account.profile.form.validation.invalidGuestCount,
        invalidBudget: dictionary.account.profile.form.validation.invalidBudget };
      setLocalError(messages[issue]);
      return false;
    }
    const panel = formRef.current?.querySelector('[data-step="' + index + '"]');
    const invalid = Array.from(panel?.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input,select') ?? []).find(input => !input.checkValidity());
    if (invalid) { requestAnimationFrame(() => invalid.reportValidity()); return false; }
    return true;
  }
  function nextStep() { if (!busy && validate(step)) changeStep(step + 1); }
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (busy || inFlight.current) { event.preventDefault(); return; }
    if (step < 5) { event.preventDefault(); nextStep(); return; }
    for (let index = 0; index < 5; index++) {
      if (!validate(index)) {
        event.preventDefault();
        setStep(index);
        requestAnimationFrame(() => headingRef.current?.focus());
        return;
      }
    }
    inFlight.current = true;
  }
  function reviewRow(label: string, value: string, index: number) {
    return <div className="wm-auth-journey__review-row" key={label}>
      <dt>{label}</dt><dd>{value || copy.notAdded}</dd>
      <button type="button" onClick={() => changeStep(index)} disabled={busy} aria-label={copy.edit + ': ' + label}>{copy.edit}</button>
    </div>;
  }

  return <>
    <form ref={formRef} action={action} onSubmit={handleSubmit} noValidate className="wm-auth-journey" aria-busy={busy}>
      <JourneyProgress steps={steps} current={step} onBack={changeStep} disabled={busy} label={copy.stepLabel} />
      <header className="wm-auth-editorial__heading">
        <p className="wm-auth-editorial__eyebrow">{copy.coupleEyebrow}</p>
        <h1 tabIndex={-1} ref={headingRef}>{titles[step]}</h1>
        <p>{bodies[step]}</p>
      </header>
      <fieldset disabled={busy} className="wm-auth-journey__panels">
        <section hidden={step !== 0} data-step="0" className="wm-auth-journey__panel">
          <label className="form-label" htmlFor="signup-full-name">{labels.fields.fullNameLabel}</label>
          <input id="signup-full-name" className="form-control" name="full_name" autoComplete="name" required maxLength={200} value={form.full_name} onChange={e => update('full_name', e.target.value)} />
          <label className="form-label" htmlFor="signup-email">{labels.emailLabel}</label>
          <input id="signup-email" className="form-control" type="email" name="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required value={form.email} onChange={e => update('email', e.target.value)} />
          <label className="form-label" htmlFor="signup-password">{labels.passwordLabel}</label>
          <PasswordInput id="signup-password" className="form-control" name="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={e => update('password', e.target.value)} />
          <p className="form-text">{copy.passwordHint}</p>
        </section>
        <section hidden={step !== 1} data-step="1" className="wm-auth-journey__panel">
          <label className="form-label" htmlFor="signup-phone">{labels.fields.phoneLabel}</label>
          <input id="signup-phone" className="form-control" type="tel" name="phone" autoComplete="tel" required maxLength={40} value={form.phone} onChange={e => update('phone', e.target.value)} />
          <label className="form-label" htmlFor="signup-country">{modal.contactCountryLabel}</label>
          <select id="signup-country" className="form-select" name="country" autoComplete="country-name" required value={form.country} onChange={e => update('country', e.target.value)}>
            <option value="">{modal.contactCountryPlaceholder}</option>
            {buildCountryOptions(form.country).map(country => <option key={country} value={country}>{country}</option>)}
          </select>
          <p className="wm-auth-journey__note">{copy.welcomeNote}</p>
        </section>
        <section hidden={step !== 2} data-step="2" className="wm-auth-journey__panel">
          <fieldset className="wm-auth-journey__styles"><legend className="form-label">{modal.chooseWeddingStyle}</legend>
            <div className="wm-signup-style-grid">
              {weddingStyleCards.map(style => <label key={style.value} className={'wm-signup-style-card' + (form.wedding_theme === style.value ? ' is-active' : '')}>
                <input className="visually-hidden" type="radio" name="wedding_theme" required value={style.value} checked={form.wedding_theme === style.value} onChange={() => update('wedding_theme', style.value)} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={style.image} alt="" loading="lazy" />
                <span><strong>{themeLabels[style.value]}</strong></span>
              </label>)}
            </div>
          </fieldset>
        </section>
        <section hidden={step !== 3} data-step="3" className="wm-auth-journey__panel">
          <div className="wm-signup-calendar" role="group" aria-label={modal.weddingDate}>
            <div className="wm-signup-calendar__header">
              <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label={modal.previousMonth}>‹</button>
              <strong aria-live="polite">{monthLabel}</strong>
              <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label={modal.nextMonth}>›</button>
            </div>
            <div className="wm-signup-calendar__week" aria-hidden="true">
              {Array.from({ length: 7 }, (_, i) => <span key={i}>{new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(new Date(2026, 10, 1 + i))}</span>)}
            </div>
            <div className="wm-signup-calendar__grid">
              {calendarDays.map((day, index) => {
                if (!day) return <span key={'blank' + index} />;
                const value = String(month.getFullYear()) + '-' + String(month.getMonth() + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
                const selected = value === form.tentative_wedding_date;
                return <button key={value} type="button" className={selected ? 'is-selected' : ''} aria-pressed={selected}
                  aria-label={new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(new Date(month.getFullYear(), month.getMonth(), day))}
                  onClick={() => update('tentative_wedding_date', value)}>{day}</button>;
              })}
            </div>
            <p className="wm-signup-selected-date" aria-live="polite">{modal.selectedDate}: {selectedDate}</p>
          </div>
        </section>
        <section hidden={step !== 4} data-step="4" className="wm-auth-journey__panel">
          <label className="form-label" htmlFor="signup-guests">{modal.guestCountOptional}</label>
          <input id="signup-guests" className="form-control" type="number" name="guest_count" min={1} step={1} inputMode="numeric" value={form.guest_count} onChange={e => update('guest_count', e.target.value)} />
          <label className="form-label" htmlFor="signup-budget">{modal.budgetOptional}</label>
          <div className="wm-auth-journey__money"><span aria-hidden="true">USD</span>
            <input id="signup-budget" className="form-control" type="number" name="wedding_budget" min={0} step="0.01" inputMode="decimal" value={form.wedding_budget} onChange={e => update('wedding_budget', e.target.value)} />
          </div>
          <p className="wm-auth-journey__note">{copy.optionalNote}</p>
          <button className="wm-auth-journey__text-button" type="button" hidden={Boolean(form.guest_count || form.wedding_budget)} onClick={() => changeStep(5)}>{copy.skip}</button>
        </section>
        <section hidden={step !== 5} data-step="5" className="wm-auth-journey__panel">
          <dl className="wm-auth-journey__review">
            {reviewRow(labels.fields.fullNameLabel, form.full_name, 0)}
            {reviewRow(labels.emailLabel, form.email, 0)}
            {reviewRow(labels.fields.phoneLabel, form.phone, 1)}
            {reviewRow(modal.contactCountryLabel, form.country, 1)}
            {reviewRow(modal.chooseWeddingStyle, themeLabels[form.wedding_theme as WeddingThemeValue], 2)}
            {reviewRow(modal.weddingDate, selectedDate, 3)}
            {reviewRow(modal.guestCountOptional, form.guest_count, 4)}
            {reviewRow(modal.budgetOptional, form.wedding_budget ? 'USD ' + form.wedding_budget : '', 4)}
          </dl>
          <p className="wm-auth-journey__note">{copy.privacyNote}</p>
        </section>
      </fieldset>
      {errorMessage && <div className="wm-auth-error" role="alert">{errorMessage}</div>}
      <footer className="wm-auth-journey__actions">
        {step > 0 && <button className="btn btn-outline-secondary" type="button" onClick={() => changeStep(step - 1)} disabled={busy}>{labels.actions.back}</button>}
        {step < 5
          ? <button className="btn btn-primary" type="button" onClick={nextStep} disabled={busy}>{labels.actions.next}</button>
          : <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? labels.submitting : labels.submit}</button>}
      </footer>
      <div className="wm-auth-journey__links">
        <p>{copy.alreadyAccount} <button type="button" disabled={busy} onClick={() => exitRef.current?.showModal()}>{dictionary.login.editorial.submit}</button></p>
        <p>{copy.switchVendor} <Link href="/signup/vendor">{dictionary.login.editorial.vendorSignup}</Link></p>
      </div>
    </form>
    <dialog ref={exitRef} className="wm-auth-journey__exit">
      <h2>{copy.leaveTitle}</h2><p>{copy.leaveBody}</p>
      <div><button type="button" className="btn btn-outline-secondary" onClick={() => exitRef.current?.close()}>{copy.stay}</button>
        <Link href={closeHref} className="btn btn-primary">{copy.leave}</Link></div>
    </dialog>
  </>;
}

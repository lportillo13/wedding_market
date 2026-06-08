'use client';

import { useActionState, useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { buildCountryOptions } from '@/lib/countries';
import { signUp, type SignUpState } from './actions';

const initialState: SignUpState = { ok: false };

const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
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

type FormShape = {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  tentative_wedding_date: string;
  guest_count: string;
  wedding_budget: string;
  celebration_city: string;
  celebration_region: string;
  country: string;
  wedding_theme: WeddingThemeValue | '';
  planning_stage: 'just-starting';
  priority_services: ['venue'];
};

type SignupDialog =
  | { kind: 'confirm-close' }
  | { kind: 'message'; message: string }
  | null;

function formatDateValue(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function TypewriterCopy({
  body,
  step,
  title,
  titleId,
  onComplete,
}: {
  body: string;
  step: number;
  title: string;
  titleId?: string;
  onComplete: (step: number) => void;
}) {
  const [typedTitle, setTypedTitle] = useState('');
  const [typedBody, setTypedBody] = useState('');

  useEffect(() => {
    let titleIndex = 0;
    let bodyIndex = 0;
    let isTypingBody = false;

    const timer = window.setInterval(() => {
      if (!isTypingBody) {
        titleIndex += 1;
        setTypedTitle(title.slice(0, titleIndex));

        if (titleIndex >= title.length) {
          isTypingBody = true;
        }

        return;
      }

      bodyIndex += 1;
      setTypedBody(body.slice(0, bodyIndex));

      if (bodyIndex >= body.length) {
        window.clearInterval(timer);
        onComplete(step);
      }
    }, isTypingBody ? 12 : 22);

    return () => window.clearInterval(timer);
  }, [body, onComplete, step, title]);

  return (
    <>
      <h2 id={titleId} className="wm-signup-step-title">
        {typedTitle}
      </h2>
      <p className="wm-signup-step-body">{typedBody}</p>
    </>
  );
}

export default function SignUpForm({
  closeHref,
  openModalOnLoad = false,
}: {
  closeHref?: string;
  openModalOnLoad?: boolean;
}) {
  const [state, action, pending] = useActionState(signUp, initialState);
  const { dictionary, language } = useLanguage();
  const labels = dictionary.signup.form;
  const page = dictionary.signup.page;
  const modal = labels.modal;
  const profileLabels = dictionary.account.profile.form;
  const [isModalOpen, setIsModalOpen] = useState(openModalOnLoad);
  const [step, setStep] = useState(0);
  const [stepDirection, setStepDirection] = useState<'forward' | 'back'>('forward');
  const [completedCopyStep, setCompletedCopyStep] = useState<number | null>(null);
  const [dialog, setDialog] = useState<SignupDialog>(null);
  const [dismissedActionMessage, setDismissedActionMessage] = useState<string | null>(null);
  const [datePickerMonth, setDatePickerMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [form, setForm] = useState<FormShape>(() => ({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    tentative_wedding_date: '',
    guest_count: '',
    wedding_budget: '',
    celebration_city: '',
    celebration_region: '',
    country: '',
    wedding_theme: '',
    planning_stage: 'just-starting',
    priority_services: ['venue'],
  }));

  const stepCount = 6;
  const countryOptions = useMemo(() => buildCountryOptions(form.country), [form.country]);
  const progress = ((step + 1) / stepCount) * 100;
  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(language === 'es' ? 'es-US' : 'en-US', {
        month: 'long',
        year: 'numeric',
      }).format(datePickerMonth),
    [datePickerMonth, language],
  );
  const calendarDays = useMemo(() => {
    const year = datePickerMonth.getFullYear();
    const month = datePickerMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return [
      ...Array.from({ length: firstDay }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [datePickerMonth]);

  const themeLabels: Record<WeddingThemeValue, string> = {
    classic: profileLabels.weddingTheme.options.classic,
    boho: profileLabels.weddingTheme.options.boho,
    rustic: profileLabels.weddingTheme.options.rustic,
    beach: profileLabels.weddingTheme.options.beach,
    garden: profileLabels.weddingTheme.options.garden,
    modern: profileLabels.weddingTheme.options.modern,
    vintage: profileLabels.weddingTheme.options.vintage,
  };

  useEffect(() => {
    if (state.ok && state.redirectTo) {
      window.location.replace(state.redirectTo);
    }
  }, [state]);

  useEffect(() => {
    document.body.classList.toggle('wm-signup-modal-is-open', isModalOpen);
    return () => document.body.classList.remove('wm-signup-modal-is-open');
  }, [isModalOpen]);

  function updateField(name: keyof FormShape, value: string) {
    setDialog(null);
    setDismissedActionMessage(null);
    setForm((current) => ({ ...current, [name]: value }));
  }

  function openSignupModal() {
    setStep(0);
    setStepDirection('forward');
    setCompletedCopyStep(null);
    setDialog(null);
    setDismissedActionMessage(null);
    setIsModalOpen(true);
  }

  function requestCloseSignupModal() {
    setDialog({ kind: 'confirm-close' });
  }

  function confirmCloseSignupModal() {
    setDialog(null);
    if (closeHref) {
      window.location.replace(closeHref);
      return;
    }

    setIsModalOpen(false);
  }

  function showMessage(message: string) {
    setDismissedActionMessage(null);
    setDialog({ kind: 'message', message });
  }

  function validateStep(targetStep = step) {
    if (targetStep === 1) {
      if (!form.full_name.trim()) return labels.validation.fullNameRequired;
      if (!form.email.trim()) return labels.validation.emailRequired;
      if (!form.phone.trim()) return modal.phoneRequired;
      return null;
    }

    if (targetStep === 2) {
      if (!form.wedding_theme) return modal.styleRequired;
      return null;
    }

    if (targetStep === 3) {
      if (!form.tentative_wedding_date) return labels.validation.dateRequired;
      return null;
    }

    if (targetStep === 4) {
      if (!form.guest_count.trim()) return labels.validation.guestCountRequired;
      return null;
    }

    if (targetStep === 5) {
      if (!form.country.trim()) return labels.validation.countryRequired;
      if (!form.wedding_budget.trim()) return labels.validation.budgetRequired;
      if (!form.password.trim()) return labels.validation.passwordRequired;
      if (form.password.trim().length < 6) return labels.validation.passwordTooShort;
      return null;
    }

    return null;
  }

  function validateAllSteps() {
    for (let index = 1; index < stepCount; index += 1) {
      const error = validateStep(index);
      if (error) {
        showMessage(error);
        setStepDirection(index > step ? 'forward' : 'back');
        setCompletedCopyStep(null);
        setStep(index);
        return false;
      }
    }

    setDialog(null);
    return true;
  }

  function showStep(nextStep: number) {
    const boundedStep = Math.max(0, Math.min(stepCount - 1, nextStep));
    if (boundedStep === step) return;
    setDialog(null);
    setStepDirection(boundedStep > step ? 'forward' : 'back');
    setCompletedCopyStep(null);
    setStep(boundedStep);
  }

  function goNext() {
    const error = validateStep();
    if (error) {
      showMessage(error);
      return;
    }

    showStep(step + 1);
  }

  function moveDatePickerMonth(delta: number) {
    setDatePickerMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function stepCopy() {
    if (step === 0) return modal.welcome;
    if (step === 1) return modal.contact;
    if (step === 2) return modal.style;
    if (step === 3) return modal.date;
    if (step === 4) return modal.guests;
    return modal.budget;
  }

  const copy = stepCopy();
  const actionMessage = state.ok ? undefined : state.message;
  const visibleDialog =
    dialog ?? (actionMessage && dismissedActionMessage !== actionMessage ? { kind: 'message' as const, message: actionMessage } : null);
  const isStepCopyComplete = completedCopyStep === step;
  const fieldsVisible = isStepCopyComplete;
  const handleCopyComplete = useCallback((completedStep: number) => {
    setCompletedCopyStep(completedStep);
  }, []);
  const dismissDialog = useCallback(() => {
    if (dialog) {
      setDialog(null);
      return;
    }

    if (actionMessage) {
      setDismissedActionMessage(actionMessage);
    }
  }, [actionMessage, dialog]);

  return (
    <>
      <div className="wm-signup-launch">
        <button type="button" className="btn btn-primary wm-signup-launch__button" onClick={openSignupModal}>
          {modal.startPlanning}
        </button>
        <p className="wm-onboarding-login-link">
          {page.alreadyHave} <a href="/login">{page.loginLink}</a>
        </p>
      </div>

      {isModalOpen ? (
        <div
          className="wm-signup-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wm-signup-modal-title"
        >
          <form
            action={action}
            className="wm-signup-modal__form"
            onSubmit={(event) => {
              if (!validateAllSteps()) {
                event.preventDefault();
              }
            }}
          >
            <header className="wm-signup-modal__header">
              <div className="wm-signup-modal__logo" aria-hidden="true">
                TWM
              </div>
              <button
                type="button"
                className="wm-signup-modal__close"
                onClick={requestCloseSignupModal}
                aria-label={modal.closeLabel}
              >
                x
              </button>
            </header>

            <div className={`wm-signup-modal__body${step === 2 ? ' wm-signup-modal__body--style' : ''}`}>
              <div className="wm-signup-progress" aria-hidden="true">
                <span style={{ width: `${progress}%` }} />
              </div>

              <div className="wm-onboarding-panels" data-direction={stepDirection}>
                <section hidden={step !== 0} className="wm-onboarding-panel wm-signup-step-card">
                  {step === 0 ? (
                    <TypewriterCopy
                      key={`copy-${step}-${language}`}
                      body={copy.body}
                      step={step}
                      title={copy.title}
                      titleId="wm-signup-modal-title"
                      onComplete={handleCopyComplete}
                    />
                  ) : null}
                </section>

                <section hidden={step !== 1} className="wm-onboarding-panel wm-signup-step-card">
                  <p className="wm-signup-kicker">{modal.stepOf} 1 / 5</p>
                  {step === 1 ? (
                    <TypewriterCopy
                      key={`copy-${step}-${language}`}
                      body={copy.body}
                      step={step}
                      title={copy.title}
                      onComplete={handleCopyComplete}
                    />
                  ) : null}
                  {step === 1 && fieldsVisible ? (
                    <div className="wm-signup-field-stack wm-signup-fields">
                      <label className="form-label" htmlFor="signup-full-name">
                        {labels.fields.fullNameLabel}
                      </label>
                      <input
                        id="signup-full-name"
                        className="form-control"
                        name="full_name"
                        value={form.full_name}
                        onChange={(event) => updateField('full_name', event.target.value)}
                        autoComplete="name"
                      />
                      <label className="form-label" htmlFor="signup-email">
                        {labels.emailLabel}
                      </label>
                      <input
                        id="signup-email"
                        className="form-control"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={(event) => updateField('email', event.target.value)}
                        autoComplete="email"
                      />
                      <label className="form-label" htmlFor="signup-phone">
                        {labels.fields.phoneLabel}
                      </label>
                      <input
                        id="signup-phone"
                        className="form-control"
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={(event) => updateField('phone', event.target.value)}
                        autoComplete="tel"
                        placeholder={labels.fields.phonePlaceholder}
                      />
                    </div>
                  ) : null}
                </section>

                <section hidden={step !== 2} className="wm-onboarding-panel wm-signup-step-card">
                  <p className="wm-signup-kicker">{modal.stepOf} 2 / 5</p>
                  {step === 2 ? (
                    <TypewriterCopy
                      key={`copy-${step}-${language}`}
                      body={copy.body}
                      step={step}
                      title={copy.title}
                      onComplete={handleCopyComplete}
                    />
                  ) : null}
                  {step === 2 && fieldsVisible ? (
                    <div className="wm-signup-fields">
                      <label className="form-label">{modal.chooseWeddingStyle}</label>
                      <div className="wm-signup-style-grid" role="radiogroup" aria-label={modal.chooseWeddingStyle}>
                        {weddingStyleCards.map((style) => {
                          const isSelected = form.wedding_theme === style.value;
                          return (
                            <button
                              key={style.value}
                              type="button"
                              role="radio"
                              className={`wm-signup-style-card${isSelected ? ' is-active' : ''}`}
                              onClick={() => updateField('wedding_theme', style.value)}
                              aria-checked={isSelected}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={style.image} alt="" />
                              <span>
                                <strong>{themeLabels[style.value]}</strong>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </section>

                <section hidden={step !== 3} className="wm-onboarding-panel wm-signup-step-card">
                  <p className="wm-signup-kicker">{modal.stepOf} 3 / 5</p>
                  {step === 3 ? (
                    <TypewriterCopy
                      key={`copy-${step}-${language}`}
                      body={copy.body}
                      step={step}
                      title={copy.title}
                      onComplete={handleCopyComplete}
                    />
                  ) : null}
                  {step === 3 && fieldsVisible ? (
                    <div className="wm-signup-fields">
                      <label className="form-label">{modal.weddingDate}</label>
                      <div className="wm-signup-calendar">
                        <div className="wm-signup-calendar__header">
                          <button type="button" onClick={() => moveDatePickerMonth(-1)} aria-label={modal.previousMonth}>
                            {'<'}
                          </button>
                          <strong>{monthLabel}</strong>
                          <button type="button" onClick={() => moveDatePickerMonth(1)} aria-label={modal.nextMonth}>
                            {'>'}
                          </button>
                        </div>
                        <div className="wm-signup-calendar__week">
                          {weekDays.map((day, index) => (
                            <span key={`${day}-${index}`}>{day}</span>
                          ))}
                        </div>
                        <div className="wm-signup-calendar__grid">
                          {calendarDays.map((day, index) => {
                            if (!day) return <span key={`blank-${index}`} />;
                            const value = formatDateValue(
                              datePickerMonth.getFullYear(),
                              datePickerMonth.getMonth(),
                              day,
                            );
                            const isSelected = form.tentative_wedding_date === value;
                            return (
                              <button
                                key={value}
                                type="button"
                                className={isSelected ? 'is-selected' : ''}
                                onClick={() => updateField('tentative_wedding_date', value)}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                        {form.tentative_wedding_date ? (
                          <p className="wm-signup-selected-date">
                            {modal.selectedDate}: {form.tentative_wedding_date}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </section>

                <section hidden={step !== 4} className="wm-onboarding-panel wm-signup-step-card">
                  <p className="wm-signup-kicker">{modal.stepOf} 4 / 5</p>
                  {step === 4 ? (
                    <TypewriterCopy
                      key={`copy-${step}-${language}`}
                      body={copy.body}
                      step={step}
                      title={copy.title}
                      onComplete={handleCopyComplete}
                    />
                  ) : null}
                  {step === 4 && fieldsVisible ? (
                    <div className="wm-signup-fields">
                      <label className="form-label" htmlFor="signup-guests">
                        {profileLabels.guestCountLabel}
                      </label>
                      <input
                        id="signup-guests"
                        className="form-control"
                        type="number"
                        min={1}
                        name="guest_count"
                        value={form.guest_count}
                        onChange={(event) => updateField('guest_count', event.target.value)}
                        placeholder="120"
                      />
                    </div>
                  ) : null}
                </section>

                <section hidden={step !== 5} className="wm-onboarding-panel wm-signup-step-card">
                  <p className="wm-signup-kicker">{modal.stepOf} 5 / 5</p>
                  {step === 5 ? (
                    <TypewriterCopy
                      key={`copy-${step}-${language}`}
                      body={copy.body}
                      step={step}
                      title={copy.title}
                      onComplete={handleCopyComplete}
                    />
                  ) : null}
                  {step === 5 && fieldsVisible ? (
                    <div className="wm-signup-field-stack wm-signup-fields">
                      <label className="form-label" htmlFor="signup-country">
                        {profileLabels.countryLabel}
                      </label>
                      <select
                        id="signup-country"
                        className="form-select"
                        name="country"
                        value={form.country}
                        onChange={(event) => updateField('country', event.target.value)}
                        autoComplete="country-name"
                      >
                        <option value="">{profileLabels.countryPlaceholder}</option>
                        {countryOptions.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>

                      <label className="form-label" htmlFor="signup-budget">
                        {profileLabels.budgetLabel}
                      </label>
                      <input
                        id="signup-budget"
                        className="form-control"
                        type="number"
                        min={0}
                        step="0.01"
                        name="wedding_budget"
                        value={form.wedding_budget}
                        onChange={(event) => updateField('wedding_budget', event.target.value)}
                        placeholder="25000"
                      />

                      <div className="wm-signup-account-save">
                        <h3>{modal.accountTitle}</h3>
                        <p>{modal.accountBody}</p>
                      </div>

                      <label className="form-label" htmlFor="signup-password">
                        {labels.passwordLabel}
                      </label>
                      <input
                        id="signup-password"
                        className="form-control"
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={(event) => updateField('password', event.target.value)}
                        autoComplete="new-password"
                        minLength={6}
                      />
                      <div className="form-text">{labels.passwordHelp}</div>
                    </div>
                  ) : null}
                </section>
              </div>

              <input type="hidden" name="tentative_wedding_date" value={form.tentative_wedding_date} />
              <input type="hidden" name="wedding_theme" value={form.wedding_theme} />
              <input type="hidden" name="planning_stage" value={form.planning_stage} />
              <input type="hidden" name="language" value={language} />
              <input type="hidden" name="priority_services" value="venue" />
              <input type="hidden" name="celebration_city" value={form.celebration_city} />
              <input type="hidden" name="celebration_region" value={form.celebration_region} />

            </div>

            <footer className="wm-signup-modal__footer">
              {step > 0 ? (
                <button type="button" className="btn btn-outline-secondary" onClick={() => showStep(step - 1)} disabled={pending}>
                  {labels.actions.back}
                </button>
              ) : null}

              {step < stepCount - 1 ? (
                <button
                  type="button"
                  className={`btn btn-primary${step === 0 ? ' wm-signup-next--full' : ''}`}
                  onClick={goNext}
                  disabled={pending || !isStepCopyComplete}
                >
                  {step === 0 ? modal.startPlanning : labels.actions.next}
                </button>
              ) : (
                <button className="btn btn-primary" disabled={pending || !isStepCopyComplete}>
                  {pending ? labels.submitting : labels.submit}
                </button>
              )}
            </footer>
          </form>

          {visibleDialog ? (
            <div className="wm-signup-dialog" role="dialog" aria-modal="true" aria-labelledby="wm-signup-dialog-title">
              <div className="wm-signup-dialog__panel">
                {visibleDialog.kind === 'confirm-close' ? (
                  <>
                    <h3 id="wm-signup-dialog-title">{modal.stopTitle}</h3>
                    <p>{modal.stopBody}</p>
                    <div className="wm-signup-dialog__actions">
                      <button type="button" className="btn btn-outline-secondary" onClick={dismissDialog}>
                        {modal.keepPlanning}
                      </button>
                      <button type="button" className="btn btn-primary" onClick={confirmCloseSignupModal}>
                        {modal.stopPlanning}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 id="wm-signup-dialog-title">{modal.messageTitle}</h3>
                    <p>{visibleDialog.message}</p>
                    <div className="wm-signup-dialog__actions">
                      <button type="button" className="btn btn-primary" onClick={dismissDialog}>
                        {modal.messageCta}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

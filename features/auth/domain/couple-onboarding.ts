export type CoupleOnboardingData = {
  full_name: string; email: string; password: string; phone: string; country: string;
  wedding_theme: string; tentative_wedding_date: string; guest_count: string; wedding_budget: string;
};

/** Serialize the whole journey, including values from earlier screens. */
export function coupleSignupPayload(form: CoupleOnboardingData, language: 'en' | 'es') {
  return {
    full_name: form.full_name.trim(), email: form.email.trim(), password: form.password,
    phone: form.phone.trim(), country: form.country, wedding_theme: form.wedding_theme,
    tentative_wedding_date: form.tentative_wedding_date, guest_count: form.guest_count,
    wedding_budget: form.wedding_budget, language, planning_stage: 'just-starting',
    priority_services: 'venue', celebration_city: '', celebration_region: '',
  };
}

export function coupleSignupIssue(form: CoupleOnboardingData, step: number) {
  if (step === 0) {
    if (!form.full_name.trim()) return 'fullNameRequired';
    if (!form.email.trim()) return 'emailRequired';
    if (!form.password) return 'passwordRequired';
    if (form.password.length < 8) return 'passwordTooShort';
  }
  if (step === 1) {
    if (!form.phone.trim()) return 'phoneRequired';
    if (!form.country.trim()) return 'countryRequired';
  }
  if (step === 2 && !form.wedding_theme) return 'styleRequired';
  if (step === 3 && !form.tentative_wedding_date) return 'dateRequired';
  if (step === 4) {
    if (form.guest_count && (!Number.isInteger(Number(form.guest_count)) || Number(form.guest_count) < 1)) return 'invalidGuestCount';
    if (form.wedding_budget && (!Number.isFinite(Number(form.wedding_budget)) || Number(form.wedding_budget) < 0)) return 'invalidBudget';
  }
  return null;
}

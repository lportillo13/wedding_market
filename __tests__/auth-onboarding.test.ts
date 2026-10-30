import assert from 'node:assert/strict';
import test from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { coupleSignupIssue, coupleSignupPayload, type CoupleOnboardingData } from '../features/auth/domain/couple-onboarding';
import { registerVendorAccount } from '../features/auth/server/vendor-account';
import { vendorSignupSchema } from '../features/auth/domain/vendor-onboarding';
import { attachVendorSignupImages } from '../features/auth/client/vendor-submission';

const couple: CoupleOnboardingData = { full_name: 'Example Couple', email: 'example@example.invalid', password: 'synthetic test password', phone: '+1 202 555 0100', country: 'United States', wedding_theme: 'garden', tentative_wedding_date: '2027-06-12', guest_count: '', wedding_budget: '' };

test('a recoverable vendor submission can retry with its retained files after native controls reset', () => {
  const images = { logo: new File(['logo'], 'example-logo.png', { type: 'image/png' }), hero: new File(['hero'], 'example-cover.webp', { type: 'image/webp' }) };
  const retry = attachVendorSignupImages(new FormData(), images);
  assert.equal((retry.get('logo_file') as File).name, 'example-logo.png');
  assert.equal((retry.get('hero_file') as File).name, 'example-cover.webp');
  const replacement = new File(['replacement'], 'new-logo.png', { type: 'image/png' });
  attachVendorSignupImages(retry, { ...images, logo: replacement });
  assert.equal((retry.get('logo_file') as File).name, 'new-logo.png');
  assert.equal(retry.getAll('logo_file').length, 1);
});

test('a verified vendor can finish business setup without resubmitting account credentials', () => {
  const result = vendorSignupSchema.safeParse({ owner_name: null, email: null, password: null, account_language: 'en', business_name: 'Example Studio', tagline: 'Wedding photography in Costa Rica', categories: ['photographer'], country: 'Costa Rica', service_radius_km: 50, event_types: [], languages: ['english'], years_in_business: null, starting_price: 0, starting_price_currency: 'USD', typical_spend: null, peak_seasons: [] });
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.starting_price, 0);
});

test('final couple payload retains earlier account/contact/planning screens and leaves optional estimates blank', () => {
  const payload = coupleSignupPayload(couple, 'es');
  const data = new FormData();
  for (const [key, value] of Object.entries(payload)) data.set(key, value);
  for (const key of ['full_name', 'email', 'password', 'phone', 'country', 'wedding_theme', 'tentative_wedding_date'] as const) assert.equal(data.get(key), couple[key]);
  assert.equal(data.get('guest_count'), '');
  assert.equal(data.get('wedding_budget'), '');
  assert.equal(data.get('language'), 'es');
  assert.equal(data.get('priority_services'), 'venue');
});

test('editing earlier couple details updates review/submission without changing the password', () => {
  const payload = coupleSignupPayload({ ...couple, email: ' revised@example.invalid ', country: 'Costa Rica', guest_count: '45', wedding_budget: '0', password: '  synthetic password  ' }, 'en');
  assert.equal(payload.email, 'revised@example.invalid');
  assert.equal(payload.country, 'Costa Rica');
  assert.equal(payload.password, '  synthetic password  ');
  assert.equal(payload.wedding_budget, '0');
  assert.equal(payload.guest_count, '45');
});

test('the couple journey requires account, contact, style and date while estimates are optional', () => {
  for (let step = 0; step < 6; step++) assert.equal(coupleSignupIssue(couple, step), null);
  assert.equal(coupleSignupIssue({ ...couple, password: 'short' }, 0), 'passwordTooShort');
  assert.equal(coupleSignupIssue({ ...couple, country: '' }, 1), 'countryRequired');
  assert.equal(coupleSignupIssue({ ...couple, wedding_theme: '' }, 2), 'styleRequired');
  assert.equal(coupleSignupIssue({ ...couple, tentative_wedding_date: '' }, 3), 'dateRequired');
  assert.equal(coupleSignupIssue({ ...couple, guest_count: '1.5' }, 4), 'invalidGuestCount');
  assert.equal(coupleSignupIssue({ ...couple, wedding_budget: '-1' }, 4), 'invalidBudget');
});

test('vendor account creation precedes business/media work and returns to vendor setup after confirmation', async () => {
  let called = false;
  const supabase = { auth: { signUp: async (input: { email: string; password: string; options: { emailRedirectTo: string; data: Record<string, unknown> } }) => {
    called = true;
    assert.equal(input.email, 'vendor@example.invalid');
    assert.equal(new URL(input.options.emailRedirectTo).pathname, '/auth/callback');
    assert.equal(new URL(input.options.emailRedirectTo).searchParams.get('next'), '/signup/vendor');
    assert.equal(input.options.data.full_name, 'Example Vendor');
    assert.equal(input.options.data.language, 'es');
    assert.equal('logo' in input.options.data, false);
    assert.equal('is_vendor' in input.options.data, false);
    return { data: { session: null }, error: null };
  } } } as unknown as SupabaseClient;
  const result = await registerVendorAccount(supabase, { fullName: ' Example Vendor ', email: ' vendor@example.invalid ', password: 'synthetic test password', language: 'es' });
  assert.equal(called, true);
  assert.equal(result.data.session, null);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { authFeedbackKey } from '../../lib/auth-feedback';

test('sign-in failures distinguish credentials, confirmation and rate limits', () => {
  assert.equal(authFeedbackKey({ code: 'invalid_credentials' }), 'invalidCredentials');
  assert.equal(authFeedbackKey({ code: 'email_not_confirmed' }), 'emailUnconfirmed');
  assert.equal(authFeedbackKey({ status: 429 }), 'rateLimited');
  assert.equal(authFeedbackKey({ code: 'over_email_send_rate_limit' }), 'rateLimited');
});

test('transport failures have connection feedback and provider diagnostics stay private', () => {
  assert.equal(authFeedbackKey(new TypeError('private transport details')), 'connectionError');
  assert.equal(authFeedbackKey({ name: 'AuthRetryableFetchError' }), 'connectionError');
  assert.equal(authFeedbackKey({ message: 'private upstream diagnostic' }), 'unavailable');
  assert.equal(authFeedbackKey(null), 'unavailable');
});

test('password recovery distinguishes expired sessions and password policy failures', () => {
  assert.equal(authFeedbackKey({ code: 'otp_expired' }), 'recoveryExpired');
  assert.equal(authFeedbackKey({ code: 'session_not_found' }), 'recoveryExpired');
  assert.equal(authFeedbackKey({ code: 'same_password' }), 'samePassword');
  assert.equal(authFeedbackKey({ code: 'weak_password' }), 'weakPassword');
});

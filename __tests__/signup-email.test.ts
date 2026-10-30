import assert from 'node:assert/strict';
import test from 'node:test';
import {checkSignupEmailAvailability, SignupEmailLimiter} from '../features/auth/server/signup-email';
import {isExistingSignupResponse} from '../features/auth/domain/signup-response';
import {authFeedbackKey} from '../lib/auth-feedback';

test('signup rejects an existing address before account creation and normalizes case and spaces', async () => {
  let lookups = 0;
  const result = await checkSignupEmailAvailability(' Taken@Example.invalid ', 'test-client', {
    limiter: new SignupEmailLimiter(),
    lookup: async email => {lookups++; assert.equal(email, 'taken@example.invalid'); return true;},
  });
  assert.deepEqual(result, {ok: false, feedback: 'emailTaken'});
  assert.equal(lookups, 1);
});

test('unused addresses can continue, while failed or invalid checks fail closed', async () => {
  assert.deepEqual(await checkSignupEmailAvailability('new@example.invalid', 'client', {
    limiter: new SignupEmailLimiter(), lookup: async () => false,
  }), {ok: true});
  assert.deepEqual(await checkSignupEmailAvailability('new@example.invalid', 'client', {
    limiter: new SignupEmailLimiter(), lookup: async () => {throw new Error('Private database diagnostics');},
  }), {ok: false, feedback: 'unavailable'});
  for (const email of ['invalid', null, 'a'.repeat(255) + '@example.invalid']) {
    assert.deepEqual(await checkSignupEmailAvailability(email, 'client', {
      limiter: new SignupEmailLimiter(), lookup: async () => {assert.fail('Invalid email must not reach lookup');},
    }), {ok: false, feedback: 'unavailable'});
  }
});

test('email admission is bounded, enforces a window and does not query after rejection', async () => {
  const limiter = new SignupEmailLimiter(2, 2, 100);
  assert.equal(limiter.allow('first', 0), true);
  assert.equal(limiter.allow('first', 1), true);
  assert.equal(limiter.allow('first', 2), false);
  assert.equal(limiter.allow('second', 2), true);
  assert.equal(limiter.allow('third', 2), false);
  assert.equal(limiter.allow('third', 101), true);
  const blocked = new SignupEmailLimiter(1, 1);
  blocked.allow('client');
  assert.deepEqual(await checkSignupEmailAvailability('example@example.invalid', 'client', {
    limiter: blocked, lookup: async () => {assert.fail('Rate limited requests must not query accounts');},
  }), {ok: false, feedback: 'rateLimited'});
});

test('provider duplicate responses cannot be shown as successful signup or confirmation', () => {
  assert.equal(isExistingSignupResponse({session: null, user: {identities: []}}), true);
  assert.equal(isExistingSignupResponse({session: null, user: {identities: [{}]}}), false);
  assert.equal(isExistingSignupResponse({session: {}, user: {identities: []}}), false);
  assert.equal(isExistingSignupResponse({session: null, user: null}), false);
  assert.equal(authFeedbackKey({code: 'user_already_exists'}), 'emailTaken');
  assert.equal(authFeedbackKey({code: 'email_exists'}), 'emailTaken');
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { authCallbackFailurePath, authRedirectUrl, safeAuthNextPath } from '../../lib/auth-redirect';

test('auth redirects use the configured public origin behind a localhost reverse proxy', () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://thewedmarket.com';
    assert.equal(authRedirectUrl('/login').href, 'https://thewedmarket.com/login');
    assert.equal(authRedirectUrl('/reset-password?from=email').href, 'https://thewedmarket.com/reset-password?from=email');
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});

test('auth next paths reject external origins, backslashes and URL-normalized controls', () => {
  for (const value of [null, 'https://example.com', '//example.com', '/\\example.com', '/\n/example.com', '/\t/example.com']) {
    assert.equal(safeAuthNextPath(value), '/');
    assert.equal(safeAuthNextPath(value, '/reset-password'), '/reset-password');
  }
  assert.equal(safeAuthNextPath('/account/profile'), '/account/profile');
  assert.equal(safeAuthNextPath(['/account/profile', '//example.com']), '/');
});

test('failed OAuth retains the intended internal destination without allowing an external redirect', () => {
  const failure = new URL(authCallbackFailurePath('/vendor/inbox?thread=example'), 'https://thewedmarket.com');
  assert.equal(failure.pathname, '/login');
  assert.equal(failure.searchParams.get('error'), 'auth_callback');
  assert.equal(failure.searchParams.get('next'), '/vendor/inbox?thread=example');
  const unsafe = new URL(authCallbackFailurePath('//example.com'), 'https://thewedmarket.com');
  assert.equal(unsafe.searchParams.get('next'), '/');
});

test('failed recovery preserves a safe original page when reset has nested query parameters', () => {
  const recovery = `/reset-password?${new URLSearchParams({ next: '/account/inbox?thread=example' })}`;
  const failure = new URL(authCallbackFailurePath(recovery), 'https://thewedmarket.com');
  assert.equal(failure.pathname, '/forgot-password');
  assert.equal(failure.searchParams.get('error'), 'recovery');
  assert.equal(failure.searchParams.get('next'), '/account/inbox?thread=example');
  const unsafe = new URL(authCallbackFailurePath('/reset-password?next=%2F%2Fexample.com'), 'https://thewedmarket.com');
  assert.equal(unsafe.searchParams.get('next'), '/account/profile');
  const lookalike = new URL(authCallbackFailurePath('/reset-password-other'), 'https://thewedmarket.com');
  assert.equal(lookalike.pathname, '/login');
});

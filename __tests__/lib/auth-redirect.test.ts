import assert from 'node:assert/strict';
import test from 'node:test';
import { authRedirectUrl, safeAuthNextPath } from '../../lib/auth-redirect';

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
});

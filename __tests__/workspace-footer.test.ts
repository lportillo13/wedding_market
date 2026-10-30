import test from 'node:test';
import assert from 'node:assert/strict';
import { usesWorkspaceFooter } from '../lib/header-navigation';

test('workspace footer includes nested vendor, account and onboarding routes', () => {
  for (const path of ['/vendor', '/vendor/profile', '/vendor/location', '/vendor/inbox/request__vendor', '/vendor/notifications/deleted', '/account/profile', '/account/inbox/request__vendor', '/signup/vendor', '/signup/check-email', '/auth/continue', '/login', '/forgot-password', '/reset-password', '/rfq/new']) {
    assert.equal(usesWorkspaceFooter(path), true, path);
  }
});

test('workspace footer respects route boundaries and leaves public pages intact', () => {
  for (const path of ['/', '/vendors', '/vendors/photographer', '/blog', '/about', '/support', '/vendor-directory', '/account-deletion']) {
    assert.equal(usesWorkspaceFooter(path), false, path);
  }
});

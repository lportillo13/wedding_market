import assert from 'node:assert/strict';
import test from 'node:test';
import {loginCallbackPath, resolveLoginDestination} from '../features/auth/domain/login-destination';

test('password and OAuth login preserve explicit personal profile and other return paths', async () => {
  for (const nextPath of ['/account/profile', '/vendor/inbox', '/vendors/example']) {
    const destination = await resolveLoginDestination(
      {nextPath, defaultWorkspace: false, userId: 'verified-vendor'},
      async () => {assert.fail('An explicit return path must not be replaced by role routing');},
    );
    assert.equal(destination, nextPath);
    const callback = new URL(loginCallbackPath(nextPath, false), 'https://example.invalid');
    assert.equal(callback.pathname, '/auth/callback');
    assert.equal(callback.searchParams.get('next'), nextPath);
  }
});

test('plain login still opens the vendor or couple workspace after authentication', async () => {
  for (const vendor of [true, false]) {
    assert.equal(await resolveLoginDestination(
      {nextPath: '/account/profile', defaultWorkspace: true, userId: 'verified-account'},
      async id => {assert.equal(id, 'verified-account'); return vendor;},
    ), vendor ? '/vendor/profile' : '/account/profile');
  }
  assert.equal(loginCallbackPath('/account/profile', true), '/auth/callback');
  assert.equal(await resolveLoginDestination(
    {nextPath: '/account/profile', defaultWorkspace: true},
    async () => {assert.fail('No role lookup without a verified account');},
  ), '/account/profile');
});

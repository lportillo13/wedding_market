import assert from 'node:assert/strict';
import test from 'node:test';
import type {User} from '@supabase/supabase-js';
import {loadInboxAccess} from '../features/accounts/server/inbox-access';

const user = {id: 'verified-account'} as User;

test('a signed-out inbox visitor must sign in even if stale role flags are present', async () => {
  assert.deepEqual(await loadInboxAccess(async () => ({user: null, isUser: true, isVendor: true})), {status: 'guest'});
});
test('a verified couple keeps its own client inbox, including an account with both roles', async () => {
  for (const isVendor of [false, true]) {
    const result = await loadInboxAccess(async () => ({user, isUser: true, isVendor}));
    assert.equal(result.status, 'client');
    if (result.status === 'client') assert.equal(result.user.id, user.id);
  }
});
test('vendor and admin-owned vendor accounts are routed away from the couple guard to their vendor inbox', async () => {
  assert.deepEqual(await loadInboxAccess(async () => ({user, isUser: false, isVendor: true})), {status: 'vendor'});
});
test('missing workspace access or a failed role lookup cannot grant couple inbox access', async () => {
  assert.deepEqual(await loadInboxAccess(async () => ({user, isUser: false, isVendor: false})), {status: 'unavailable'});
  assert.deepEqual(await loadInboxAccess(async () => {throw new Error('Role lookup failed');}), {status: 'unavailable'});
});

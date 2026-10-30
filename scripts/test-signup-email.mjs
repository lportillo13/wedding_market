import assert from 'node:assert/strict';
import test from 'node:test';
import {createLocalSchema} from './database/local-schema.mjs';

test('signup email lookup is private, read-only and detects every existing account state', async t => {
  const {db} = await createLocalSchema();
  t.after(() => db.close());
  await db.exec("INSERT INTO public.languages(code,name) VALUES ('en','English'),('es','Español') ON CONFLICT DO NOTHING");
  const first = '00000000-0000-4000-8000-000000008001';
  const second = '00000000-0000-4000-8000-000000008002';
  await db.query('INSERT INTO auth.users(id,email,email_confirmed_at) VALUES ($1,$2,now()),($3,$4,null)', [first, 'existing@example.invalid', second, 'Unconfirmed@Example.invalid']);
  const as = async (role, email) => {
    await db.exec('BEGIN');
    try {
      await db.exec('SET LOCAL ROLE ' + role);
      const result = await db.query('SELECT public.wm_signup_email_exists($1) AS exists', [email]);
      await db.exec('COMMIT');
      return result.rows[0].exists;
    } catch (error) {await db.exec('ROLLBACK'); throw error;}
  };
  for (const role of ['anon', 'authenticated']) await assert.rejects(as(role, 'existing@example.invalid'), {code: '42501'});
  assert.equal(await as('service_role', ' EXISTING@example.invalid '), true);
  assert.equal(await as('service_role', 'unconfirmed@example.invalid'), true);
  assert.equal(await as('service_role', 'new@example.invalid'), false);
  for (const email of [null, '', 'a'.repeat(255)]) await assert.rejects(as('service_role', email), {code: '22023'});
  const unchanged = (await db.query('SELECT email,email_confirmed_at IS NULL AS unconfirmed FROM auth.users WHERE id=$1', [second])).rows[0];
  assert.deepEqual(unchanged, {email: 'Unconfirmed@Example.invalid', unconfirmed: true});
  const settings = (await db.query("SELECT proconfig,prosecdef FROM pg_proc WHERE oid='public.wm_signup_email_exists(text)'::regprocedure")).rows[0];
  assert.equal(settings.prosecdef, true);
  assert.ok(settings.proconfig.includes('search_path=pg_catalog'));
  assert.ok(settings.proconfig.includes('statement_timeout=3s'));
});

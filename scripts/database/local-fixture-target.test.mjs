import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {assertLocalFixtureTargets}=createRequire(import.meta.url)('./local-fixture-target.cjs');
test('demo data can only target a local database and local Auth API together',()=>{
  assert.doesNotThrow(()=>assertLocalFixtureTargets('postgresql://postgres:fixture@127.0.0.1:54322/postgres','http://localhost:54321'));
  assert.throws(()=>assertLocalFixtureTargets('postgresql://postgres:fixture@db.project.supabase.co/postgres','http://localhost:54321'),/Remote targets/);
  assert.throws(()=>assertLocalFixtureTargets('postgresql://postgres:fixture@127.0.0.1/postgres','https://project.supabase.co'),/Remote targets/);
  assert.throws(()=>assertLocalFixtureTargets('not-a-uri','http://localhost'),/valid local/);
});

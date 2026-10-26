import test from 'node:test';
import assert from 'node:assert/strict';
import { databaseConnectionOptions } from './connection.mjs';
import { URL } from 'node:url';

test('remote exports always verify certificates and strip URI TLS overrides', () => {
  const options = databaseConnectionOptions('postgresql://audit:example@db.example.com/postgres?sslmode=require&ssl=false&sslrootcert=ignored', { ca: 'test-ca' });
  assert.deepEqual(options.ssl, { rejectUnauthorized: true, ca: 'test-ca' });
  assert.equal(new URL(options.connectionString).searchParams.has('sslmode'), false);
  assert.equal(new URL(options.connectionString).searchParams.has('sslrootcert'), false);
  assert.equal(new URL(options.connectionString).searchParams.has('ssl'), false);
});

test('only loopback can use an unencrypted local development connection', () => {
  assert.equal(databaseConnectionOptions('postgresql://postgres:example@127.0.0.1:54322/postgres').ssl, false);
  assert.throws(() => databaseConnectionOptions('postgresql://user:example@db.example.com/postgres?sslmode=disable'));
  assert.throws(() => databaseConnectionOptions('postgresql://user:example@db.example.com/postgres', { tlsOverride: '0' }));
  assert.equal(databaseConnectionOptions('postgresql://user:example@db.example.com/postgres').ssl.rejectUnauthorized, true);
});

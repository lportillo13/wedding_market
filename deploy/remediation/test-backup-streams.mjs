import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { encryptAndVerify, verifyAgeFile } from './backup-streams.mjs';

const age = process.argv[2] ?? '/usr/bin/age';
const keygen = process.argv[3] ?? '/usr/bin/age-keygen';
const directory = await mkdtemp(join(tmpdir(), 'wm-backup-synthetic-'));
try {
  const key = join(directory, 'synthetic-identity.txt');
  execFileSync(keygen, ['-o', key], { stdio: 'ignore' });
  const recipient = execFileSync(keygen, ['-y', key], { encoding: 'utf8' }).trim();
  const source = randomBytes(1024 * 1024);
  const encrypted = join(directory, 'synthetic.age');
  const result = await encryptAndVerify(Readable.from([source]), encrypted, recipient, key, age);
  assert.equal(result.bytes, source.length);
  const file = await readFile(encrypted);
  assert.equal(file.includes(source.subarray(0, 100)), false);
  file[file.length - 3] ^= 1;
  await writeFile(encrypted, file);
  await assert.rejects(verifyAgeFile(encrypted, key, age));
  console.log('PASS: real age encrypt/decrypt hash readback, ciphertext check, and tamper rejection with synthetic data.');
} finally {
  // Only this newly created synthetic fixture directory is removed.
  assert.equal(directory.startsWith(join(tmpdir(), 'wm-backup-synthetic-')), true);
  await rm(directory, { recursive: true, force: true });
}

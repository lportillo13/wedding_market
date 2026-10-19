import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { Transform, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

function completion(child) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', code => code === 0 ? resolve() : reject(new Error('age operation failed')));
  });
}

// Standard age files; no application-specific encryption format or plaintext temp file.
export async function encryptAndVerify(source, output, recipient, identity, age = '/usr/bin/age') {
  const hash = createHash('sha256');
  let bytes = 0;
  const tap = new Transform({ transform(chunk, encoding, done) { bytes += chunk.length; hash.update(chunk); done(null, chunk); } });
  const encryption = spawn(age, ['--recipient', recipient, '--output', output], { stdio: ['pipe', 'ignore', 'ignore'] });
  const encrypted = completion(encryption);
  try {
    await Promise.all([pipeline(source, tap, encryption.stdin), encrypted]);
  } catch (error) { encryption.kill(); throw error; }
  const expected = hash.digest('hex');
  const actual = await verifyAgeFile(output, identity, age);
  if (actual.sha256 !== expected || actual.bytes !== bytes) throw new Error('Encrypted backup readback mismatch');
  return { sha256: expected, bytes };
}

export async function verifyAgeFile(input, identity, age = '/usr/bin/age') {
  const hash = createHash('sha256');
  let bytes = 0;
  const decryption = spawn(age, ['--decrypt', '--identity', identity, input], { stdio: ['ignore', 'pipe', 'ignore'] });
  const decrypted = completion(decryption);
  const sink = new Writable({ write(chunk, encoding, done) { bytes += chunk.length; hash.update(chunk); done(); } });
  try { await Promise.all([pipeline(decryption.stdout, sink), decrypted]); }
  catch (error) { decryption.kill(); throw error; }
  return { sha256: hash.digest('hex'), bytes };
}

#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { execFileSync, spawn } from 'node:child_process';
import { mkdir, open, readFile, rename, stat, statfs } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { encryptAndVerify } from './backup-streams.mjs';

const app = '/var/www/wedding-market';
const config = '/etc/wedding-market-backups';
const storage = '/var/backups/wedding-market-data';
const project = 'aousexbvujjnvbudpsmz';
const bucket = 'the-wedding-market';
// Backup dependencies are installed separately in this root-owned directory.
// A deploy-owned application checkout must never supply code to a root timer.
const require = createRequire(import.meta.url);

async function databaseBackup(directory, recipient, identity) {
  let db;
  try { db = JSON.parse(await readFile(`${config}/database.json`, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  const direct = db.host === `db.${project}.supabase.co` && db.user === 'postgres';
  const pool = /^aws-[0-9]+-[a-z0-9-]+\.pooler\.supabase\.com$/.test(db.host) && db.user === `postgres.${project}`;
  if ((!direct && !pool) || db.port !== 5432 || db.database !== 'postgres') throw new Error('Backup database scope mismatch');
  const env = { PATH: '/usr/bin:/bin', PGHOST: db.host, PGPORT: '5432', PGUSER: db.user, PGPASSWORD: db.password,
    PGDATABASE: 'postgres', PGSSLMODE: 'verify-full', PGSSLROOTCERT: `${config}/server-ca.crt`,
    PGCONNECT_TIMEOUT: '15', PGOPTIONS: '-c default_transaction_read_only=on -c statement_timeout=180000',
    PGAPPNAME: 'wedding-market-encrypted-backup' };
  const dump = spawn('/usr/lib/postgresql/17/bin/pg_dump', ['--format=custom', '--no-owner', '--lock-wait-timeout=10s',
    '--schema=public', '--schema=auth', '--schema=supabase_migrations'], { env, stdio: ['ignore', 'pipe', 'ignore'], timeout: 240000 });
  const dumped = new Promise((resolve, reject) => {
    dump.once('error', reject); dump.once('close', code => code === 0 ? resolve() : reject(new Error('Database backup failed')));
  });
  const path = `${directory}/database.dump.age`;
  let summary;
  try { [summary] = await Promise.all([encryptAndVerify(dump.stdout, path, recipient, identity), dumped]); }
  catch (error) { dump.kill(); throw error; }
  // Inspect the decrypted custom archive without restoring or printing its contents.
  const decrypt = spawn('/usr/bin/age', ['--decrypt', '--identity', identity, path], { stdio: ['ignore', 'pipe', 'ignore'] });
  const list = spawn('/usr/lib/postgresql/17/bin/pg_restore', ['--list'], { stdio: ['pipe', 'ignore', 'ignore'] });
  const done = child => new Promise((resolve, reject) => {
    child.once('error', reject); child.once('close', code => code === 0 ? resolve() : reject(new Error('Archive inspection failed')));
  });
  const inspected = await Promise.allSettled([pipeline(decrypt.stdout, list.stdin), done(decrypt), done(list)]);
  // pg_restore may close stdin after reading its TOC. The entire encrypted file
  // was already authenticated and hashed above; an early reader exit is safe.
  if (inspected[2].status !== 'fulfilled') throw new Error('Archive inspection failed');
  return { ...summary, archiveListPassed: true, schemas: ['public', 'auth', 'supabase_migrations'] };
}

async function main() {
  if (process.getuid?.() !== 0) throw new Error('Run the reviewed backup as root');
  process.umask(0o077);
  const identity = `${config}/identity.txt`;
  if ((await stat(identity)).mode & 0o077) throw new Error('Backup identity permissions are unsafe');
  const recipient = execFileSync('/usr/bin/age-keygen', ['-y', identity], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  // age-keygen -y is used below; keep the actual identity out of all process arguments/output.
  if (!/^age1[0-9a-z]+$/.test(recipient)) throw new Error('Expected an age public recipient');
  for (const name of ['R2_ENDPOINT','R2_ACCOUNT_ID','R2_BUCKET','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY']) delete process.env[name];
  const fileEnv = require('@next/env').loadEnvConfig(app, false, { info() {}, error() {} }, true).parsedEnv ?? {};
  const processes = JSON.parse(execFileSync('/usr/sbin/runuser', ['-u', 'deploy', '--', 'env', 'HOME=/home/deploy', 'PM2_HOME=/home/deploy/.pm2', '/usr/bin/pm2', 'jlist'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  const targets = processes.filter(p => p.name === 'wedding-market');
  if (targets.length !== 1) throw new Error('Expected one Wedding Market process');
  const named = targets[0].pm2_env.env ?? {};
  const value = name => String(named[name] ?? fileEnv[name] ?? '').trim();
  const endpoint = value('R2_ENDPOINT') || `https://${value('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`;
  if (new URL(endpoint).origin !== 'https://25d3ff9e595c0bf20100641457bea5e8.r2.cloudflarestorage.com' || (value('R2_BUCKET') && value('R2_BUCKET') !== bucket)) throw new Error('R2 backup scope mismatch');
  const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
  const client = new S3Client({ region: 'auto', endpoint, forcePathStyle: true, maxAttempts: 2,
    credentials: { accessKeyId: value('R2_ACCESS_KEY_ID'), secretAccessKey: value('R2_SECRET_ACCESS_KEY') } });
  const objects = [];
  let token;
  do {
    const result = await client.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }), { abortSignal: AbortSignal.timeout(30000) });
    objects.push(...(result.Contents ?? [])); token = result.IsTruncated ? result.NextContinuationToken : undefined;
    if (objects.length > 100000 || (result.IsTruncated && !token)) throw new Error('Unexpected object listing');
  } while (token);
  await mkdir(storage, { recursive: true, mode: 0o700 });
  const free = await statfs(storage);
  const totalBytes = objects.reduce((n, object) => n + Number(object.Size ?? 0), 0);
  if (free.bavail * free.bsize < Math.max(5 * 1024 ** 3, totalBytes * 2)) throw new Error('Insufficient backup disk reserve');
  const stamp = new Date().toISOString().replaceAll(':', '').replaceAll('-', '').replace(/\.\d+Z$/, 'Z');
  const pending = `${storage}/.incomplete-${stamp}`;
  const completed = `${storage}/${stamp}`;
  await mkdir(pending, { mode: 0o700 });
  const manifest = { version: 1, createdAt: new Date().toISOString(), project, bucket, objects: [] };
  for (const object of objects) {
    if (!object.Key || Number(object.Size) > 100 * 1024 ** 2) throw new Error('Unexpected object size');
    const name = createHash('sha256').update(object.Key).digest('hex') + '.age';
    const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: object.Key, IfMatch: object.ETag }), { abortSignal: AbortSignal.timeout(60000) });
    const summary = await encryptAndVerify(response.Body, `${pending}/${name}`, recipient, identity);
    if (summary.bytes !== Number(object.Size)) throw new Error('Object changed during backup');
    manifest.objects.push({ key: object.Key, file: name, ...summary, etag: object.ETag, contentType: response.ContentType, cacheControl: response.CacheControl });
  }
  manifest.database = await databaseBackup(pending, recipient, identity);
  await encryptAndVerify(Readable.from([JSON.stringify(manifest, null, 2)]), `${pending}/manifest.json.age`, recipient, identity);
  await rename(pending, completed);
  const uid = Number(execFileSync('id', ['-u', 'wm-audit-20261019'], { encoding: 'utf8' }).trim());
  const gid = Number(execFileSync('id', ['-g', 'wm-audit-20261019'], { encoding: 'utf8' }).trim());
  // Export ciphertext only, never the recovery identity or database configuration.
  const archive = `/home/wm-audit-20261019/wedding-market-backup-${stamp}.tar`;
  const handle = await open(archive, 'wx+', 0o600);
  const archiveHash = createHash('sha256');
  try {
    execFileSync('/usr/bin/tar', ['--create', '--file=-', '--directory', storage, '--', stamp], { stdio: ['ignore', handle.fd, 'ignore'] });
    for await (const chunk of handle.createReadStream({ start: 0, autoClose: false })) archiveHash.update(chunk);
    await handle.chown(uid, gid);
  } finally { await handle.close(); }
  const result = { completedAt: new Date().toISOString(), backupDirectory: completed, encryptedObjectCount: objects.length,
    sourceObjectBytes: totalBytes, encryptedReadbackPassed: true, databaseBackup: Boolean(manifest.database),
    databaseArchiveListPassed: Boolean(manifest.database?.archiveListPassed), fullRestoreTested: false, offHostCopy: false,
    encryptedExportArchive: archive, encryptedExportSha256: archiveHash.digest('hex') };
  const resultPath = '/home/wm-audit-20261019/owner-backup-results.json';
  const temporaryResult = `${resultPath}.${process.pid}.tmp`;
  const resultHandle = await open(temporaryResult, 'wx', 0o600);
  try {
    await resultHandle.writeFile(JSON.stringify(result, null, 2) + '\n');
    await resultHandle.chown(uid, gid);
  } finally { await resultHandle.close(); }
  await rename(temporaryResult, resultPath);
  console.log(JSON.stringify(result));
}

main().catch(() => { console.error('Backup stopped; no successful recovery claim. Review private configuration, capacity and connectivity.'); process.exitCode = 1; });

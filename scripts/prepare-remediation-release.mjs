import { execFileSync } from 'node:child_process';
import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
if (git('branch', '--show-current') !== 'codex/audit-remediation') throw new Error('Unexpected release branch.');
const commit = git('rev-parse', 'HEAD');
const output = '.cache/remediation-release';
await mkdir(output, { recursive: true });
const sha = data => createHash('sha256').update(data).digest('hex');
const names = ['owner-deploy.py', 'owner-origin-hardening.py', 'owner-service-key.py'];
const toolHashes = {};
for (const name of names) {
  const source = await readFile(`deploy/remediation/${name}`);
  const committed = execFileSync('git', ['show', `HEAD:deploy/remediation/${name}`]);
  if (sha(source) !== sha(committed)) throw new Error(`Commit the reviewed tool first: ${name}`);
  await copyFile(`deploy/remediation/${name}`, `${output}/${name}`);
  if (name !== 'owner-service-key.py') toolHashes[name] = sha(source);
}
git('bundle', 'create', `${output}/wedding-market-remediation.bundle`, 'codex/audit-remediation', '^07f4f489c108fc850d6f7c22292d3a328c3fe747');
git('bundle', 'verify', `${output}/wedding-market-remediation.bundle`);
const patch = JSON.parse(await readFile('docs/audit-2026-10-19/production-patch-import.json', 'utf8'));
const manifest = {
  commit,
  bundleSha256: sha(await readFile(`${output}/wedding-market-remediation.bundle`)),
  preservedProductionPatchFiles: patch.files.map(file => file.file),
  preservedProductionHashes: Object.fromEntries(patch.files.map(file => [file.file, file.server_sha256])),
  mediaDomainReady: true,
  toolHashes,
};
const serialized = JSON.stringify(manifest, null, 2) + '\n';
await writeFile(`${output}/release-manifest.json`, serialized);
await writeFile(`${output}/review-checksums.json`, JSON.stringify({ commit, manifestSha256: sha(serialized), tools: Object.fromEntries(await Promise.all(names.map(async n => [n, sha(await readFile(`${output}/${n}`))]))) }, null, 2) + '\n');
console.log(JSON.stringify({ commit, manifestSha256: sha(serialized), deploymentToolSha256: toolHashes['owner-deploy.py'], output }, null, 2));

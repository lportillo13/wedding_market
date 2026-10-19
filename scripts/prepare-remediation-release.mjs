import { execFileSync } from 'node:child_process';
import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
if (git('branch', '--show-current') !== 'codex/audit-remediation') throw new Error('Unexpected release branch.');
const commit = git('rev-parse', 'HEAD');
const expectedBase = process.argv.find(argument => argument.startsWith('--expected-base='))?.split('=')[1];
if (!expectedBase || !/^[a-f0-9]{40}$/.test(expectedBase)) throw new Error('Pass --expected-base=<verified live commit>.');
git('merge-base', '--is-ancestor', expectedBase, commit);
const isOriginalCheckout = expectedBase === '07f4f489c108fc850d6f7c22292d3a328c3fe747';
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
  if (name === 'owner-deploy.py' || (isOriginalCheckout && name === 'owner-origin-hardening.py')) toolHashes[name] = sha(source);
}
git('bundle', 'create', `${output}/wedding-market-remediation.bundle`, 'codex/audit-remediation', `^${expectedBase}`);
git('bundle', 'verify', `${output}/wedding-market-remediation.bundle`);
const patch = isOriginalCheckout
  ? JSON.parse(await readFile('docs/audit-2026-10-19/production-patch-import.json', 'utf8'))
  : { files: [] };
const manifest = {
  commit,
  expectedBaseCommit: expectedBase,
  bundleSha256: sha(await readFile(`${output}/wedding-market-remediation.bundle`)),
  preservedProductionPatchFiles: patch.files.map(file => file.file),
  preservedProductionHashes: Object.fromEntries(patch.files.map(file => [file.file, file.server_sha256])),
  mediaDomainReady: isOriginalCheckout,
  requiredPublicMarkup: ['wm-site-header', 'wm-site-header__menu-button', 'wm-mobile-navigation'],
  toolHashes,
};
const serialized = JSON.stringify(manifest, null, 2) + '\n';
const manifestSha256 = sha(serialized);
await writeFile(`${output}/release-manifest.json`, serialized);
const wrapperSource = await readFile('deploy/remediation/run-owner-release.sh', 'utf8');
if (sha(wrapperSource) !== sha(execFileSync('git', ['show', 'HEAD:deploy/remediation/run-owner-release.sh']))) throw new Error('Commit the reviewed release wrapper first.');
if (!wrapperSource.includes('umask 077\n')) throw new Error('Release wrapper anchor changed.');
const wrapper = wrapperSource.replace('umask 077\n', `umask 077\nset -- '${manifestSha256}' '${toolHashes['owner-deploy.py']}'\n`);
await writeFile(`${output}/run-owner-release.sh`, wrapper);
const wrapperSha256 = sha(wrapper);
await writeFile(`${output}/review-checksums.json`, JSON.stringify({ commit, manifestSha256, wrapperSha256, tools: Object.fromEntries(await Promise.all(names.map(async n => [n, sha(await readFile(`${output}/${n}`))]))) }, null, 2) + '\n');
console.log(JSON.stringify({ commit, manifestSha256, wrapperSha256, deploymentToolSha256: toolHashes['owner-deploy.py'], output }, null, 2));

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const output = '.cache/deployment-setup';
const digest = value => createHash('sha256').update(value).digest('hex');
const names = ['deployment-gateway.py', 'owner-deploy.py', 'install-deployment-gateway.sh'];
const sources = {};
await mkdir(output, { recursive: true });
for (const name of names) {
  const path = `deploy/remediation/${name}`;
  const bytes = await readFile(path);
  const committed = execFileSync('git', ['show', `HEAD:${path}`]);
  if (digest(bytes) !== digest(committed)) throw new Error(`Commit the reviewed setup source first: ${name}`);
  sources[name] = bytes;
}
const gatewaySha256 = digest(sources['deployment-gateway.py']);
const deploymentToolSha256 = digest(sources['owner-deploy.py']);
const template = sources['install-deployment-gateway.sh'].toString('utf8');
if (!template.includes('umask 077\n')) throw new Error('Installer template anchor changed.');
const installer = template.replace('umask 077\n', `umask 077\nset -- '${gatewaySha256}' '${deploymentToolSha256}'\n`);
await writeFile(`${output}/deployment-gateway.py`, sources['deployment-gateway.py']);
await writeFile(`${output}/owner-deploy.py`, sources['owner-deploy.py']);
await writeFile(`${output}/install-deployment-gateway.sh`, installer);
const report = {
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  installerSha256: digest(installer), gatewaySha256, deploymentToolSha256, output,
};
await writeFile(`${output}/review-checksums.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));

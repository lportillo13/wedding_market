import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

async function discover(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(entries.map(entry => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? discover(filename) : /\.test\.js$/.test(entry.name) ? [filename] : [];
  }));
  return groups.flat().sort();
}
const files = await discover('dist-tests');
if (!files.length) throw new Error('No compiled tests found. Run test:build first.');
const child = spawn(process.execPath, ['--require','./scripts/register-test-paths.cjs','--test',...files], { stdio:'inherit' });
child.on('error', error => { console.error(error); process.exitCode=1; });
child.on('exit', code => { process.exitCode=code ?? 1; });

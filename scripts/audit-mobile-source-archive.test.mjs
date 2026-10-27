import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { inspectSourceArchive } from './audit-mobile-source-archive.mjs';

test('actual source archive rejects empty, changed and sensitive payloads', async () => {
  const cache = path.resolve('.cache');
  await fs.mkdir(cache, { recursive: true });
  const temp = await fs.mkdtemp(path.join(cache, 'archive-test-'));
  const source = path.join(temp, 'source'), archive = path.join(temp, 'archive');
  try {
    const files = ['mobile/App.tsx','mobile/package.json','mobile/package-lock.json','mobile/app.json','mobile/app.config.js','mobile/eas.json','mobile/metro.config.js','mobile/tsconfig.json','mobile/src/screen.ts','mobile/assets/icon.png','shared/rules.ts'];
    for (const file of files) {
      await fs.mkdir(path.dirname(path.join(source,file)), { recursive: true });
      await fs.writeFile(path.join(source,file), 'fixture');
    }
    await fs.mkdir(archive);
    assert.equal((await inspectSourceArchive(source,archive)).passed,false);
    await fs.cp(source,archive,{recursive:true});
    assert.equal((await inspectSourceArchive(source,archive)).passed,true);
    await fs.writeFile(path.join(archive,'shared/rules.ts'),'changed');
    assert.deepEqual((await inspectSourceArchive(source,archive)).mismatched,['shared/rules.ts']);
    await fs.writeFile(path.join(archive,'mobile/credentials.json'),'{}');
    assert.deepEqual((await inspectSourceArchive(source,archive)).sensitive,['mobile/credentials.json']);
    await fs.writeFile(path.join(archive,'mobile/src/key.ts'),'-----BEGIN PRIVATE KEY-----');
    assert.ok((await inspectSourceArchive(source,archive)).sensitive.includes('mobile/src/key.ts'));
  } finally {
    if (!temp.startsWith(cache + path.sep)) throw Error('Unsafe fixture cleanup path');
    await fs.rm(temp,{recursive:true,force:true});
  }
});

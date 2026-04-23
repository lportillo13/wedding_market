const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const ROOT = process.cwd();
const connectionString = process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const includeDirs = ['app', 'lib', 'components'];
const fileExtensions = new Set(['.ts', '.tsx']);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      files.push(...walk(fullPath));
    } else if (fileExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function collectRefs(pattern) {
  const refs = new Map();
  for (const dir of includeDirs) {
    const absDir = path.join(ROOT, dir);
    for (const file of walk(absDir)) {
      const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
      lines.forEach((line, index) => {
        for (const match of line.matchAll(pattern)) {
          const name = match[1];
          if (!refs.has(name)) refs.set(name, []);
          refs.get(name).push(`${file}:${index + 1}`);
        }
      });
    }
  }
  return refs;
}

async function main() {
  const tableRefs = collectRefs(/\.from\(\s*["'`]([^"'`]+)["'`]\s*\)/g);
  const rpcRefs = collectRefs(/\.rpc\(\s*["'`]([^"'`]+)["'`]\s*/g);

  const client = new Client({ connectionString });
  await client.connect();
  try {
    const relations = await client.query(`
      select table_name as name
      from information_schema.tables
      where table_schema = 'public'
      union
      select table_name as name
      from information_schema.views
      where table_schema = 'public'
      order by name
    `);
    const routines = await client.query(`
      select routine_name as name
      from information_schema.routines
      where routine_schema = 'public'
      order by name
    `);

    const relationSet = new Set(relations.rows.map((row) => row.name));
    const routineSet = new Set(routines.rows.map((row) => row.name));

    const missingRelations = [...tableRefs.keys()].filter((name) => !relationSet.has(name));
    const missingRpcs = [...rpcRefs.keys()].filter((name) => !routineSet.has(name));

    console.log('Referenced relations:', [...tableRefs.keys()].sort().join(', '));
    console.log('Referenced RPCs:', [...rpcRefs.keys()].sort().join(', '));
    console.log('Missing relations:', missingRelations.length ? missingRelations.join(', ') : '(none)');
    console.log('Missing RPCs:', missingRpcs.length ? missingRpcs.join(', ') : '(none)');

    if (missingRelations.length) {
      console.log('\nRelation references:');
      for (const name of missingRelations) {
        console.log(`- ${name}`);
        for (const ref of tableRefs.get(name)) console.log(`  ${ref}`);
      }
    }

    if (missingRpcs.length) {
      console.log('\nRPC references:');
      for (const name of missingRpcs) {
        console.log(`- ${name}`);
        for (const ref of rpcRefs.get(name)) console.log(`  ${ref}`);
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

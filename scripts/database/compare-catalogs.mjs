import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import console from 'node:console';
import { fileURLToPath } from 'node:url';

function normalize(value) {
  if (typeof value === 'string') return value.replaceAll('\r', '');
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, normalize(value[key])]));
  return value;
}

/** PostgreSQL 18 catalogs NOT NULL as constraints; PG17 represents it on columns. */
export function compareCatalogs(local, live) {
  const groups = {};
  for (const group of ['columns', 'constraints', 'indexes', 'policies', 'functions', 'views']) {
    if (!Array.isArray(local[group]) || !Array.isArray(live[group])) throw new Error(`Missing catalog group: ${group}`);
    const entries = catalog => catalog[group].filter(item => group !== 'constraints' || item.type !== 'n');
    const keyFor = item => group === 'columns' ? `${item.table}.${item.column}` : group === 'functions' ? `${item.name}(${item.arguments})` : `${item.table ? item.table + '.' : ''}${item.name}`;
    const left = new Map(entries(local).map(item => [keyFor(item), item]));
    const right = new Map(entries(live).map(item => [keyFor(item), item]));
    const differences = [...new Set([...left.keys(), ...right.keys()])].filter(key => JSON.stringify(normalize(left.get(key))) !== JSON.stringify(normalize(right.get(key))));
    groups[group] = { local: left.size, live: right.size, differences };
  }
  return { checkedAt: new Date().toISOString(), matches: Object.values(groups).every(group => !group.differences.length), normalization: 'CR line endings and PG18 NOT NULL catalog entries only; column nullability is compared explicitly.', groups };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [, , localFile, liveFile, output] = process.argv;
  if (!localFile || !liveFile || !output) throw new Error('Provide local catalog, live catalog and report paths.');
  const report = compareCatalogs(JSON.parse(await readFile(localFile, 'utf8')), JSON.parse(await readFile(liveFile, 'utf8')));
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  if (!report.matches) process.exitCode = 1;
}

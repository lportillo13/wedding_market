const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DUMP_PATH = 'C:\\Users\\lport\\Downloads\\db_cluster-24-10-2025@04-35-21.backup';
const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

const dump = fs.readFileSync(DUMP_PATH, 'utf8');
const lines = dump.split(/\r?\n/);

const publicPrelude = [
  'set check_function_bodies = off;',
  'set client_min_messages = warning;',
  'drop schema if exists public cascade;',
  'create schema public;',
  'create extension if not exists pgcrypto with schema extensions;',
  'create extension if not exists pgjwt with schema extensions;',
  'create extension if not exists pg_trgm with schema public;',
  'create extension if not exists "uuid-ossp" with schema extensions;',
  'grant usage on schema public to postgres, anon, authenticated, service_role;',
  'grant create on schema public to postgres, authenticated, service_role;',
].join('\n');

const sectionOrder = [
  'TYPE',
  'SEQUENCE',
  'TABLE',
  'DEFAULT',
  'FUNCTION',
  'VIEW',
  'RULE',
  'SEQUENCE SET',
  'CONSTRAINT',
  'FK CONSTRAINT',
  'INDEX',
  'TRIGGER',
  'ROW SECURITY',
  'POLICY',
];

function parseMetadata(line) {
  const match = line.match(/^-- Name: (.*?); Type: (.*?); Schema: (.*?); Owner: (.*)$/);
  if (!match) return null;
  return {
    name: match[1],
    type: match[2],
    schema: match[3],
    owner: match[4],
  };
}

function isBlockHeader(index) {
  return (
    lines[index] === '--' &&
    (parseMetadata(lines[index + 1] || '') || /^-- Data for Name: /.test(lines[index + 1] || '')) &&
    lines[index + 2] === '--'
  );
}

function collectPublicBlocks() {
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] !== '--') continue;
    const metadata = parseMetadata(lines[i + 1] || '');
    if (!metadata || lines[i + 2] !== '--') continue;

    const bodyStart = i + 4;
    let j = bodyStart;
    while (j < lines.length) {
      if (isBlockHeader(j)) {
        break;
      }
      if (lines[j].startsWith('\\connect ') || lines[j].startsWith('\\restrict ') || lines[j].startsWith('\\unrestrict ')) {
        break;
      }
      j += 1;
    }

    if (metadata.schema === 'public' && sectionOrder.includes(metadata.type)) {
      const body = lines.slice(bodyStart, j).join('\n').trim();
      if (body) {
        blocks.push({ ...metadata, body });
      }
    }

    i = j - 1;
  }
  return blocks;
}

function buildSqlByType(blocks, type) {
  return blocks
    .filter((block) => block.type === type)
    .map((block) => block.body)
    .join('\n\n');
}

function copyBlock(tableName) {
  const escaped = tableName.replace('.', '\\.');
  const re = new RegExp(`^COPY ${escaped} \\([^\\n]+\\) FROM stdin;[\\s\\S]*?^\\\\\\.\\s*$`, 'm');
  const match = dump.match(re);
  return match ? match[0].trim() : '';
}

function parseCopyBlock(tableName) {
  const block = copyBlock(tableName);
  if (!block) return null;

  const copyLines = block.split(/\r?\n/);
  const header = copyLines[0];
  const headerMatch = header.match(/^COPY\s+([^\s]+)\s+\(([^)]+)\)\s+FROM stdin;$/);
  if (!headerMatch) {
    throw new Error(`Could not parse COPY header for ${tableName}`);
  }

  return {
    table: headerMatch[1],
    columns: headerMatch[2].split(',').map((column) => column.trim()),
    rows: copyLines.slice(1, -1).map((line) =>
      line.split('\t').map((value) => {
        if (value === '\\N') return null;
        return value
          .replace(/\\\\/g, '\\')
          .replace(/\\t/g, '\t')
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r');
      }),
    ),
  };
}

const publicBlocks = collectPublicBlocks();
const preDataSql = [
  publicPrelude,
  buildSqlByType(publicBlocks, 'TYPE'),
  buildSqlByType(publicBlocks, 'SEQUENCE'),
  buildSqlByType(publicBlocks, 'TABLE'),
  buildSqlByType(publicBlocks, 'DEFAULT'),
].join('\n\n');

const postDataSql = [
  buildSqlByType(publicBlocks, 'FUNCTION'),
  buildSqlByType(publicBlocks, 'VIEW'),
  buildSqlByType(publicBlocks, 'RULE'),
  buildSqlByType(publicBlocks, 'SEQUENCE SET'),
  buildSqlByType(publicBlocks, 'CONSTRAINT'),
  buildSqlByType(publicBlocks, 'FK CONSTRAINT'),
  buildSqlByType(publicBlocks, 'INDEX'),
  buildSqlByType(publicBlocks, 'TRIGGER'),
  buildSqlByType(publicBlocks, 'ROW SECURITY'),
  buildSqlByType(publicBlocks, 'POLICY'),
  'grant all on all tables in schema public to anon, authenticated, service_role;',
  'grant all on all sequences in schema public to anon, authenticated, service_role;',
  'grant all on all functions in schema public to anon, authenticated, service_role;',
].join('\n\n');

const copyTables = [
  'auth.users',
  'public.amenity_lookup',
  'public.blog_posts',
  'public.categories',
  'public.languages',
  'public.profile_translated_fields',
  'public.profiles',
  'public.quotes',
  'public.reviews',
  'public.rfq_invites',
  'public.rfqs',
  'public.site_settings',
  'public.vendor_amenities',
  'public.vendor_categories',
  'public.vendor_locations',
  'public.vendor_media',
  'public.vendor_pricing',
  'public.vendor_spaces',
  'public.vendor_team',
  'public.vendors',
];

const copyData = copyTables.map(parseCopyBlock).filter(Boolean);

async function insertCopyData(client) {
  for (const block of copyData) {
    if (block.rows.length === 0) continue;

    const columnSql = block.columns.map((column) => `"${column}"`).join(', ');
    const values = [];
    const rowPlaceholders = block.rows.map((row, rowIndex) => {
      const placeholders = row.map((_, columnIndex) => {
        values.push(row[columnIndex]);
        return `$${rowIndex * block.columns.length + columnIndex + 1}`;
      });
      return `(${placeholders.join(', ')})`;
    });

    await client.query(
      `insert into ${block.table} (${columnSql}) values ${rowPlaceholders.join(', ')}`,
      values,
    );
  }
}

async function main() {
  const outPath = path.join(process.cwd(), 'supabase', 'restore-public-from-dump.sql');
  fs.writeFileSync(outPath, `${preDataSql}\n\n-- data inserted programmatically\n\n${postDataSql}\n`);
  console.log(`Wrote ${outPath}`);

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query('begin');
    await client.query(preDataSql);
    await client.query("set session_replication_role = replica");
    await insertCopyData(client);
    await client.query(postDataSql);
    await client.query("set session_replication_role = origin");
    await client.query('commit');

    const tables = await client.query(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
      order by table_name
    `);
    const users = await client.query('select count(*)::int as count from auth.users');
    const vendors = await client.query('select count(*)::int as count from public.vendors');
    const profiles = await client.query('select count(*)::int as count from public.profiles');
    console.log('Public tables restored:', tables.rows.map((r) => r.table_name).join(', '));
    console.log('auth.users:', users.rows[0].count);
    console.log('public.vendors:', vendors.rows[0].count);
    console.log('public.profiles:', profiles.rows[0].count);
  } finally {
    try {
      await client.query("set session_replication_role = origin");
      await client.query('rollback');
    } catch {}
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

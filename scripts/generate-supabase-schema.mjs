#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Missing Supabase connection details. Please set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY/SUPABASE_SECRET_KEY/SUPABASE_ANON_KEY).'
  );
  process.exit(1);
}

const schemaEnv = process.env.SUPABASE_SCHEMAS || process.env.SUPABASE_SCHEMA || 'public';
const schemas = schemaEnv
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

if (schemas.length === 0) {
  console.error('No schemas provided to inspect.');
  process.exit(1);
}

const outputArg = process.argv[2];
const outputPath = resolve(process.cwd(), outputArg || 'schema/supabase-schema.json');

const baseUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1`;
const headers = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  Accept: 'application/json'
};

async function fetchMeta(resource) {
  const response = await fetch(`${baseUrl}/pg_meta/${resource}?select=*`, { headers });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to fetch pg_meta/${resource}: ${response.status} ${message}`);
  }
  return response.json();
}

try {
  const [tables, columns, constraints, indexes] = await Promise.all([
    fetchMeta('tables'),
    fetchMeta('columns'),
    fetchMeta('constraints'),
    fetchMeta('indexes')
  ]);

  const schemaSet = new Set(schemas);
  const schemaMap = {};

  for (const table of tables) {
    if (!schemaSet.has(table.schema)) {
      continue;
    }

    if (!schemaMap[table.schema]) {
      schemaMap[table.schema] = {};
    }

    schemaMap[table.schema][table.name] = {
      comment: table.comment ?? null,
      columns: [],
      constraints: [],
      indexes: []
    };
  }

  for (const column of columns) {
    if (!schemaSet.has(column.schema)) {
      continue;
    }

    const table = schemaMap[column.schema]?.[column.table_name];
    if (!table) {
      continue;
    }

    table.columns.push({
      name: column.name,
      position: column.ordinal_position,
      type: column.data_type,
      nullable: column.is_nullable,
      default: column.default_value,
      comment: column.comment ?? null
    });
  }

  for (const constraint of constraints) {
    if (!schemaSet.has(constraint.schema)) {
      continue;
    }

    const table = schemaMap[constraint.schema]?.[constraint.table_name];
    if (!table) {
      continue;
    }

    table.constraints.push({
      name: constraint.name,
      type: constraint.type,
      definition: constraint.definition
    });
  }

  for (const index of indexes) {
    if (!schemaSet.has(index.schema)) {
      continue;
    }

    const table = schemaMap[index.schema]?.[index.table_name];
    if (!table) {
      continue;
    }

    table.indexes.push({
      name: index.name,
      definition: index.definition
    });
  }

  for (const schemaName of Object.keys(schemaMap)) {
    for (const tableName of Object.keys(schemaMap[schemaName])) {
      schemaMap[schemaName][tableName].columns.sort((a, b) => a.position - b.position);
    }
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(schemaMap, null, 2));

  console.log(`Supabase schema written to ${outputPath}`);
} catch (error) {
  console.error('Failed to generate Supabase schema:');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}


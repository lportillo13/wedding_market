#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';

async function loadEnvFile(filePath) {
  const contents = await readFile(filePath, 'utf8');
  const loadedKeys = [];

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const declaration = line.startsWith('export ')
      ? line.slice('export '.length).trim()
      : line;

    const equalsIndex = declaration.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = declaration.slice(0, equalsIndex).trim();
    let value = declaration.slice(equalsIndex + 1).trim();

    if (!key || value === undefined || value === null) {
      continue;
    }

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    } else {
      const commentIndex = value.search(/\s+#/);
      if (commentIndex !== -1) {
        value = value.slice(0, commentIndex);
      }
      value = value.replace(/\\ /g, ' ').trim();
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
      loadedKeys.push(key);
    }
  }

  return loadedKeys;
}

async function loadEnvFiles() {
  const envFiles = ['.env.local', '.env'];
  const loadedFiles = [];

  for (const envFile of envFiles) {
    const absolutePath = resolve(process.cwd(), envFile);
    if (!existsSync(absolutePath)) {
      continue;
    }

    try {
      const keys = await loadEnvFile(absolutePath);
      if (keys.length > 0) {
        loadedFiles.push({ file: envFile, keys });
      }
    } catch (error) {
      console.warn(`Unable to read ${envFile}:`, error instanceof Error ? error.message : error);
    }
  }

  if (loadedFiles.length > 0) {
    const summary = loadedFiles
      .map(({ file, keys }) => `${file} (${keys.join(', ')})`)
      .join('; ');
    console.info(`Loaded environment variables from: ${summary}`);
  }

  return loadedFiles.flatMap(({ keys }) => keys);
}

await loadEnvFiles();

const urlSources = [
  ['SUPABASE_URL', process.env.SUPABASE_URL],
  ['NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL]
];
const keySources = [
  ['SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY],
  ['SUPABASE_SERVICE_KEY', process.env.SUPABASE_SERVICE_KEY],
  ['SUPABASE_SECRET_KEY', process.env.SUPABASE_SECRET_KEY],
  ['SUPABASE_ANON_KEY', process.env.SUPABASE_ANON_KEY]
];

const supabaseUrlEntry = urlSources.find(([, value]) => value);
const supabaseKeyEntry = keySources.find(([, value]) => value);

const supabaseUrl = supabaseUrlEntry?.[1];
const supabaseKey = supabaseKeyEntry?.[1];

if (!supabaseUrl || !supabaseKey) {
  const missingMessages = [];

  if (!supabaseUrl) {
    const urlEnvNames = urlSources.map(([name]) => name).join(', ');
    missingMessages.push(`Supabase URL (set one of ${urlEnvNames})`);
  }

  if (!supabaseKey) {
    const keyEnvNames = keySources.map(([name]) => name).join(', ');
    missingMessages.push(`Supabase service key (set one of ${keyEnvNames})`);
  }

  console.error(`Missing required environment variables: ${missingMessages.join(' and ')}.`);
  console.error(
    'If the values are stored in a file such as .env.local, run this script from the project root so it can load them automatically, or preload them with a tool like `npx dotenv-cli -e .env.local -- npm run schema:supabase`.'
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
  const response = await fetch(`${baseUrl}/${resource}?select=*`, {
    headers: {
      ...headers,
      'Accept-Profile': 'pg_meta'
    }
  });
  if (!response.ok) {
    const message = await response.text();
    const error = new Error(`Failed to fetch pg_meta.${resource}: ${response.status} ${message}`);
    error.status = response.status;
    error.responseBody = message;
    throw error;
  }
  return response.json();
}

try {
  const [tables, columns, constraints, indexes] = await Promise.all([
    fetchMeta('tables'),
    fetchMeta('columns'),
    fetchMeta('constraints'),
    fetchMeta('indexes').catch((error) => {
      if (error?.status === 404) {
        console.warn('pg_meta indexes endpoint not available. Continuing without index information.');
        return [];
      }

      throw error;
    })
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


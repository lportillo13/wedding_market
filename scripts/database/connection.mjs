import { URL } from 'node:url';

/** Avoid URI ssl options silently overriding node-postgres's explicit TLS policy. */
export function databaseConnectionOptions(connectionString, { ca, tlsOverride } = {}) {
  if (tlsOverride === '0') throw new Error('Global TLS certificate verification must be enabled.');
  const url = new URL(connectionString);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('A PostgreSQL connection URL is required.');
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const mode = url.searchParams.get('sslmode');
  if (!loopback && ['disable', 'allow', 'prefer', 'no-verify'].includes(mode)) throw new Error('Remote database connections require verified TLS.');
  for (const key of ['ssl', 'sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'uselibpqcompat']) url.searchParams.delete(key);
  return {
    connectionString: url.toString(),
    ssl: loopback && !['require', 'verify-ca', 'verify-full'].includes(mode) ? false : { rejectUnauthorized: true, ...(ca ? { ca } : {}) },
    connectionTimeoutMillis: 10_000,
    statement_timeout: 15_000,
    query_timeout: 20_000,
    application_name: 'wedding-market-schema-export',
  };
}

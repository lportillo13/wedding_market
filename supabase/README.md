# Database source of truth

All new database changes belong in `migrations/` as reviewed, uniquely versioned SQL. Preserve applied migrations unchanged. The live source history currently runs from `202610190000` to `202610260008`.

`202610190000_live_schema_baseline.sql` reconstructs the recovered empty schema for tests. It was recorded as already applied on the existing production database. **Never execute this baseline over production.** `legacy/` contains older installation fragments retained for reference; do not apply them as a parallel migration chain. `tests/schema-baseline.sql` supplies managed Auth/role stubs for the disposable PostgreSQL test engine.

From the repository root:

```powershell
npm run db:inspect
npm run test:database
npm run test:tooling
```

`db:inspect` replays every migration into an in-memory PostgreSQL engine and writes metadata into ignored `.cache/restructure-2026-10-26`. It never connects to production. `scripts/database/catalog.sql` is a read-only catalog query used to compare a live schema with that replay. `scripts/database/compare-catalogs.mjs` compares the resulting JSON, including policies, function body fingerprints, views, indexes, constraints, defaults and nullability. PG18's separate NOT NULL constraint entries are normalized because live PG17 represents those on columns; nullability itself remains compared.

`npm run schema:supabase -- <snapshot-path>` exports live structural metadata only when a private `SUPABASE_DB_URL` is configured. Remote TLS verifies certificates; provide `SUPABASE_DB_CA_FILE` for a trusted provider CA if needed. It uses a read-only transaction, bounded connection/query timeouts and sanitized errors. Environment files, credentials and data dumps must stay outside source control. A metadata export is not a backup or restore rehearsal.

Production migration execution is separate from an application deployment. Use additive, backward-compatible changes, isolated fixtures, preflight checks and reviewed receipts. Preserve independent vendor bookings, private conversations and contact-consent boundaries during any rollback. The October 26 restructuring required no production DDL or data migration because the live catalog matched the reproducible source.

Migration `202610260008` adds the bounded, invoker-only notification mailbox. See [resource verification](../docs/resource-health-2026-10-26/README.md).

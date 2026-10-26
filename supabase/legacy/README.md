# Historical SQL — not an installation or migration path

These fragments predate the recovered October 19 schema baseline and migrations. They are retained for historical review. Do not apply them over the live database: later migrations contain the authoritative authorization, atomic workflow, conversation and independent-booking rules.

All new schema changes belong in `supabase/migrations` with a unique increasing version. Validate the full chain with `npm run db:inspect` and `npm run test:database`. The recovered `202610190000_live_schema_baseline.sql` is replayed for an empty test database; it was only recorded, not executed over the existing production database. Never replay that baseline on production.

Former locations: `migrations/vendor_profile.sql` and the four top-level `sql/*.sql` workflow fragments. Historical audit notes refer to those paths as they existed at the time.

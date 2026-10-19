# Wedding Market audit remediation

Updated October 19, 2026. The user authorized a complete recheck and fixes. The mobile app is for development and testing. Paid Hetzner backups were explicitly declined and remain disabled.

## Live fixes

Database migrations 202610190001 through 202610190003 have been committed and independently read back. The recovered baseline 202610190000 is recorded in migration history; it was not re-executed over existing data. All 23 public tables have RLS. Anonymous writes and unsafe table/schema grants are revoked. Policies and guards address profile role escalation, uninvited or closed proposal writes, review ownership/date manipulation, rating spoofing, arbitrary notification recipients, and private view access. Quote versions are unique and allocated under a transaction lock; atomic section replacement and booking RPCs are installed.

The new inbox, directory, masked contact and thread identity helpers are live. Inbox summaries have a 50-thread page limit; directory cards contain bounded fields. A production comparison of the same 12 directory rows measured 9,982 bytes for the new cards versus 24,789 for the former rows. This compares database JSON only, not total HTTP transfer or latency. The new application readers are awaiting server deployment.

Cloudflare now uses Full (strict), minimum TLS 1.2 and Always Use HTTPS. The R2 custom domain media.thewedmarket.com is Active with minimum TLS 1.2. Existing r2.dev links remain available during migration. Hetzner deletion and rebuild protection is enabled. Supabase's minimum password length is eight; confirmation remains enabled.

## Validated application changes awaiting deployment

Email signup uses ordinary confirmation and no privileged auto-confirm fallback. Business mutations use the user's RLS session. Admin pages and server actions require MFA. Uploads authenticate before buffering; enforce actual stream and file limits; restrict image formats and decoding pixels; cap simultaneous jobs, FFmpeg threads and runtime; clean failed batch uploads; and append media atomically. R2 ownership checks cover both configured media hosts. Public media helpers no longer import the server storage SDK into the browser.

The web and mobile inboxes use paged summaries and load message bodies when a thread opens. Individual thread history remains subject to the existing REST result limit and is not paginated. Public directory/search requests have bounds and meaningful failure UI. Notifications refresh less often and only in the foreground. Mobile section saves and booking use atomic database operations. Node 22 Docker images, standalone Next output, defensive headers and private readiness checks are included. The CSP is a baseline restriction and does not yet implement a full script-source nonce policy.

Migrations 202610190004 and 202610190005 are staged for deployment after the web app: remove vendor raw contact reads, and enforce admin AAL2 in database policies while preserving self-profile access for enrollment. They are not yet live.

## Validation

- Web: 26 tests, typecheck, lint and production build pass using supported Node 24.19.0.
- Database: 17 synthetic regression checks pass in PostgreSQL 18.6/PGlite, including the unsafe baseline reproduction, ownership, roles, private reads, contact masking, atomic workflows, media limits, paged summaries and admin MFA. Applied migrations also passed rollback-only validation in production PostgreSQL 17.6. No customer rows were used in tests. A multi-connection contention test and fresh Supabase CLI reset remain unverified; local Docker was unavailable.
- Mobile: typecheck, lint, 28 tests, Expo SDK compatibility check and Android Hermes export pass. These changes require a new development build.
- Dependencies: compatible web updates leave four high findings, all under the unpatched braces dependency used by development tooling. Mobile leaves 52 affected packages, zero critical, 47 high and five moderate, rooted in braces, node-forge and sprintf-js. Their latest registry releases remain flagged. No forced Expo or React Native downgrade was applied.
- New and modified text artifacts were scanned for JWTs, common secret keys and password-bearing database URLs; no matches were found.

## Server rollout and recovery

The existing audit SSH account is unprivileged. The deploy key did not authenticate. Reviewed owner tools build a separate release as deploy, run a loopback shadow smoke test, preserve the entire old checkout, replace only the Wedding Market PM2 process, and revert that process/path on a failed smoke test. The origin tool validates the existing Nginx layout, preserves ACME, adds a Wedding Market-only Cloudflare source allowlist and API rate limit, validates Nginx and keeps a rollback copy. Neither tool changes the other hosted applications.

The configured service credential still returns 401. Its repair must follow removal of public privileged signup. The owner-only prompt validates a key with a zero-record HEAD request and updates only Wedding Market; keys never belong in chat, source or audit output. A bucket-scoped R2 credential remains an owner handoff. Historical credential rotation for another project is unverified and outside the active browser scope.

Paid server backups are off by user choice. A full database backup, independent R2 copy and recovery exercise are still outstanding. The server currently lacks pg_dump/pg_restore. No recovery success is claimed until an encrypted backup is collected and verified, and an isolated restore is tested. No new subscription was enabled.

## Evidence

The original audit-report.md is the historical read-only assessment. database-remediation-committed.json and database-queries-committed.json record the applied database state. The remediation test and dependency files record this branch's checks. Screenshots show the saved database, Cloudflare, R2, password and Hetzner changes. production-patch-import.json records the seven server patch files preserved before edits. Raw server originals stay in ignored .cache, not in this release.

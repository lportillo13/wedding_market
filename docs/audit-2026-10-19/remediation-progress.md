# Wedding Market audit remediation

Updated October 19, 2026. The user authorized a complete recheck and fixes. The mobile app is for development and testing. Paid Hetzner backups were explicitly declined and remain disabled.

## Live fixes

Database migrations 202610190001 through 202610190005 have been committed and independently read back. Final verification at 19:03 UTC confirms 23 MFA-restricted public tables and removal of the raw vendor contact policy. The recovered baseline 202610190000 is recorded in migration history; it was not re-executed over existing data. All 23 public tables have RLS. Anonymous writes and unsafe table/schema grants are revoked. Policies and guards address profile role escalation, uninvited or closed proposal writes, review ownership/date manipulation, rating spoofing, arbitrary notification recipients, and private view access. Quote versions are unique and allocated under a transaction lock; atomic section replacement and booking RPCs are installed.

The new inbox, directory, masked contact and thread identity helpers are live. Inbox summaries have a 50-thread page limit; directory cards contain bounded fields. A production comparison of the same 12 directory rows measured 9,982 bytes for the new cards versus 24,789 for the former rows. This compares database JSON only, not total HTTP transfer or latency. The new application readers are deployed in release 60cbcb5085d71b60100fa5c91e52b99079001740.

Cloudflare now uses Full (strict), minimum TLS 1.2 and Always Use HTTPS. The R2 custom domain media.thewedmarket.com is Active with minimum TLS 1.2. Existing r2.dev links remain available during migration. Hetzner deletion and rebuild protection is enabled. Supabase's minimum password length is eight; confirmation remains enabled.

## Deployed application changes

Email signup uses ordinary confirmation and no privileged auto-confirm fallback. Business mutations use the user's RLS session. Admin pages and server actions require MFA. Uploads authenticate before buffering; enforce actual stream and file limits; restrict image formats and decoding pixels; cap simultaneous jobs, FFmpeg threads and runtime; clean failed batch uploads; and append media atomically. R2 ownership checks cover both configured media hosts. Public media helpers no longer import the server storage SDK into the browser.

The web and mobile inboxes use paged summaries and load message bodies when a thread opens. Individual thread history remains subject to the existing REST result limit and is not paginated. Public directory/search requests have bounds and meaningful failure UI. Notifications refresh less often and only in the foreground. Mobile section saves and booking use atomic database operations. Node 22 Docker images, standalone Next output, defensive headers and private readiness checks are included. The CSP is a baseline restriction and does not yet implement a full script-source nonce policy.

Migrations 202610190004 and 202610190005 were applied after the application passed live smoke checks. Vendor contact reads use the masked view; admin database access requires AAL2 while the self-profile remains readable for enrollment. The owner must enroll their own authenticator.

## Validation

- Web: 26 tests, typecheck, lint and production build pass using supported Node 24.19.0.
- Database: 17 synthetic regression checks pass in PostgreSQL 18.6/PGlite, including the unsafe baseline reproduction, ownership, roles, private reads, contact masking, atomic workflows, media limits, paged summaries and admin MFA. Applied migrations also passed rollback-only validation in production PostgreSQL 17.6. No customer rows were used in tests. A multi-connection contention test and fresh Supabase CLI reset remain unverified; local Docker was unavailable.
- Mobile: typecheck, lint, 28 tests, Expo SDK compatibility check and Android Hermes export pass. These changes require a new development build.
- Dependencies: compatible web updates leave four high findings, all under the unpatched braces dependency used by development tooling. Mobile leaves 52 affected packages, zero critical, 47 high and five moderate, rooted in braces, node-forge and sprintf-js. Their latest registry releases remain flagged. No forced Expo or React Native downgrade was applied.
- New and modified text artifacts were scanned for JWTs, common secret keys and password-bearing database URLs; no matches were found.

## Server rollout and recovery

The application deployed successfully as release 60cbcb5085d71b60100fa5c91e52b99079001740. Shadow and live probes passed for pages, bounded directory results, protected APIs and security headers. The full former checkout is /var/www/wedding-market.before-20261019-185347. Two initial rollout attempts stopped before switching because restrictive parent permissions blocked source cloning; the owner corrected those permissions. The reviewed tool now sets the required parent permissions explicitly. The existing audit SSH account remains unprivileged. Reviewed owner tools build a separate release as deploy, run a loopback shadow smoke test, preserve the entire old checkout, replace only the Wedding Market PM2 process, and revert that process/path on a failed smoke test. The origin tool validates the existing Nginx layout, preserves ACME, adds a Wedding Market-only Cloudflare source allowlist and API rate limit, validates Nginx and keeps a rollback copy. Neither tool changes the other hosted applications.

The initial 401 service credential failure is repaired. The owner entered the correct key in a hidden root-terminal prompt; the zero-record SDK probe passed, only Wedding Market restarted, and an independent post-restart health check returned 200 with defensive headers intact. No key was printed or collected. Public privileged signup has been removed. A bucket-scoped R2 credential remains an owner handoff. Historical credential rotation for another project is unverified and outside the active browser scope.

Paid server backups remain off by user choice. All 31 R2 objects (7,346,704 source bytes) were encrypted with standard age files, decrypted to hashing sinks, and verified. The daily timer is active. A 7,403,520-byte encrypted archive was copied to this computer with the user’s explicit approval, and its SHA256 matches the server export. The owner encrypted the recovery identity with a hidden passphrase, verified its decrypted readback, and explicitly approved its ciphertext transfer to this computer; that checksum also matches. An isolated restore remains outstanding. The Supabase database still needs its connection password; the only local configured PostgreSQL URI targets localhost. The owner said they only use Supabase and has not provided a database password. pg_dump/pg_restore were absent at initial check. No new subscription was enabled.

## Evidence

The original audit-report.md is the historical read-only assessment. database-remediation-committed.json and database-queries-committed.json record the applied database state. The remediation test and dependency files record this branch's checks. Screenshots show the saved database, Cloudflare, R2, password and Hetzner changes. production-patch-import.json records the seven server patch files preserved before edits. Raw server originals stay in ignored .cache, not in this release.


## Additional live infrastructure verification

The origin tool uses Cloudflare’s documented public IP API because the website IP endpoints returned HTTP errors from the server. Its 22 official ranges, loopback exceptions and Wedding Market-only API limit are installed. Direct-origin HTTPS returns 403; the normal public directory remains available through Cloudflare. An isolated loopback check sent 26 health requests under a test visitor key: 22 returned 200 and four returned 429, confirming enforcement without using customer traffic. Security response headers were verified against the live process. The old Nginx site is saved under /var/backups/wedding-market-nginx/20261019-190539.

The independent backup runtime has zero known npm vulnerabilities, and real Ubuntu age tests passed hash readback, ciphertext and tamper rejection using synthetic data. Root result files use atomic writes to avoid following audit-account symlinks.

Automatic approval review initially rejected the encrypted production-media export because the exact destination needed approval. The user then explicitly approved transferring those 31 objects and their encrypted manifest to C:\wedding-market\.cache\private-backups; that exact transfer and checksum verification succeeded. That media-only transfer excluded credentials and the recovery identity. The owner later gave separate explicit approval for the passphrase-protected recovery identity ciphertext, which was copied and checksum-verified; its original plaintext and passphrase were never read.

Two additional database settings require follow-up: SSL enforcement is off (DB09), and PostgreSQL direct/pooler access currently accepts connections from all IPs (DB10). Supabase HTTPS APIs still enforce TLS. Enabling database SSL requires a brief database reboot, so it remains pending the connection/backup check and a coordinated maintenance step. Network restrictions require an inventory of legitimate SQL clients and must not lock out the owner.

## Local operational alignment after deployment

The local Node pin now matches production Node 22; Node 24 validation also passed. Local Supabase password configuration now matches the hosted eight-character minimum. The automatic prestart hook that launched a local Supabase Docker stack was removed; db:start remains an explicit development command. These local startup/configuration changes do not alter the running standalone release. Shell/Python tool files have explicit LF attributes so copied checksum-pinned helpers survive Windows checkouts.

The full per-finding status is in finding-status.md. Backup setup now stages dependency changes and restores previous configuration/runtime on a failed initial database copy; synthetic Linux failure regressions pass. This newer helper has not yet been used for a database-password setup.

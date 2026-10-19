# Wedding Market finding status

Updated October 19, 2026. This tracks the original 32 findings plus two settings discovered during remediation. The original [audit](audit-report.md) is the historical assessment; [remediation progress](remediation-progress.md) records implementation and evidence. The live web release is `60cbcb5085d71b60100fa5c91e52b99079001740`; database migrations `202610190001` through `202610190005` are applied. Later owner-tool and documentation changes are separate from that application release.

“Fixed live” means the change is deployed and the stated checks passed. It does not imply a full authenticated penetration test or production restore rehearsal. Mobile changes are tested source for the owner's development app and still need a new build.

| Finding | Current status | Evidence or remaining work |
| --- | --- | --- |
| DB00 Anonymous writes | Fixed live | All 23 public tables have RLS; unsafe anonymous grants revoked. Synthetic policy regressions pass. |
| DB01 Self-admin escalation | Fixed live | Profile guard blocks privileged role assignment; Auth metadata cannot grant admin. Admin access requires AAL2. Review historical admin assignments through the owner separately. |
| DB02 Private proposal view | Fixed live | Private views use caller security or explicit membership; anonymous private access revoked. |
| DB03 Proposal authorization | Fixed live | Invitation, ownership, open/expiry and immutable version rules enforced in PostgreSQL. |
| DB04 Draft vendor visibility | Fixed live | Public reads require publication; narrow thread identity preserves authorized existing conversations. |
| DB05 Notification recipients | Fixed live | Relationship checks and recipient-only read-state changes. |
| DB06 Quote version collisions | Fixed live | Transaction lock and unique thread/version index. True concurrent multi-connection test remains outstanding. |
| DB07 Review authorization and ratings | Fixed live | Booking/date/author checks and guarded rating recomputation; synthetic tests cover legitimate and denied paths. |
| DB08 Index gaps | Targeted fixes live | Added leading indexes for vendor spaces, message senders, amenity/category keys and notification actors. Small language lookups were not indexed automatically; workload measurement and duplicate-index review remain. |
| WM01 Web dependencies | Compatible fixes deployed; upstream findings remain | Runtime framework/image/parser updates deployed. Four high dependency-chain findings remain in development tooling under unpatched braces. |
| WM02 Cross-owner R2 deletion | Fixed live | UUID namespace and exact current/legacy host checks; ownership tests pass. Live authenticated upload/deletion still needs a disposable owned asset. |
| WM03 Signup confirmation bypass | Fixed live | Privileged auto-confirm fallback removed; ordinary email confirmation and safe profile provisioning used. |
| WM04 Idle notification polling | Fixed live | Foreground-only, coalesced and throttled refresh. Peak user-load measurements remain outstanding. |
| WM05 Upload resource bounds | Fixed live | Stream/file/decode limits, concurrency bounds, FFmpeg timeout/threads, failure cleanup and atomic media append. |
| WM06 Inbox overfetch | Main fix live; history pagination remains | Summary RPC pages at 50; message bodies load for the selected thread. Long individual thread history still has the existing REST result limit. |
| WM07 Public search payload | Fixed live | Bounded card RPC, result/page/query bounds and short cache. Same 12 database rows measured 9,982 versus 24,789 JSON bytes; not an HTTP latency comparison. |
| WM08 Node support | Release/build paths updated | Production Node 22, Docker Node 22 and supported Node 24 validation. The computer's default Node 20 remains old; use the pinned/supported runtime. |
| WM09 Browser headers | Baseline fixed live | Live checks confirm defensive headers and baseline CSP. Full script-source nonce policy is not implemented. |
| WM10 Mobile replacement writes | Source fixed and tested | Four vendor sections use atomic RPCs. A new development mobile build is needed. |
| WM11 Database baseline | Fixed in version control and live history | Recovered baseline plus five applied migrations. PGlite and live PostgreSQL rollback-only validation passed; a fresh Supabase CLI reset remains unverified. |
| WM12 Readiness | Implemented; alerts remain | Liveness remains public; private admin-AAL2 readiness probes credential/storage configuration. Credential probe and post-restart health pass. Alert delivery is not configured. |
| WM13 Historical other-project credential | Owner verification pending | Different historical Supabase project; no access or rotation evidence established in this project scope. |
| WM14 Docker packaging | Source corrected; deployment uses standalone Node | Standalone output, Node 22 and explicit asset copying. Docker image execution on the shared host was not performed. |
| WM15 Mobile dependencies | Compatible fixes tested; upstream findings remain | SDK-aligned patches and shell-quote/image-size updates; Android export passes. Remaining 52 affected packages have three unpatched advisory roots; installed-app exploitability is not established. |
| WM16 Recovery | Partial: real encrypted media copies verified | 31 R2 objects encrypted and readback verified; daily timer active; approved off-host archive checksum matches. The owner separately approved a passphrase-protected identity copy; it is off-host with a matching checksum. Database backup, retention/alerting and isolated restore remain outstanding. Paid Hetzner backups stay disabled by user choice. |
| WM17 Invalid service credential | Fixed live | Owner completed the hidden key prompt. Sanitized SDK probe success collected independently; only Wedding Market restarted and health returned 200. |
| WM18 Production drift | Fixed for deployed release | Seven original production patch files preserved and reconciled; release built from reviewed Git commit. Full old checkout kept for rollback. |
| WM19 Auth/admin controls | Partial | Password minimum eight; email confirmation remains on; app and database admins require AAL2. TOTP provider is enabled. Owner enrollment, CAPTCHA integration and remaining recovery/session choices require follow-up; no paid leaked-password protection was enabled. |
| WM20 Public media endpoint | Custom domain active; legacy migration remains | New URLs use media.thewedmarket.com. Existing r2.dev links remain available until stored references/clients migrate. |
| WM21 Direct-origin bypass | Primary fix live | Nginx Cloudflare source allowlist and per-visitor API limit installed; direct-origin HTTPS returns 403; public directory works. Shared Cloudflare IP ranges do not authenticate a specific zone; authenticated origin pulls remain a stronger follow-up. |
| WM22 Broad R2 credential | Owner credential rotation pending | Existing token can access all account buckets. Create a Wedding Market-only replacement, identify old consumers, verify an owned test asset, then revoke the superseded credential. |
| WM23 TLS policy | Fixed live | Cloudflare Full (strict), minimum TLS 1.2, Always Use HTTPS; media custom domain minimum TLS 1.2. |
| DB09 PostgreSQL SSL enforcement | Pending coordinated change | Dashboard enforcement is off. Supabase HTTPS APIs still use TLS. Enabling database enforcement requires a brief database reboot; first establish the backup connection. |
| DB10 PostgreSQL network restrictions | Pending client inventory | Direct/pooler database access accepts all IPs. Inventory legitimate SQL clients and server egress before applying an allowlist. |

## Verification limits

Web tests, typecheck, lint and production build passed. Database synthetic authorization/transaction regressions and production rollback-only DDL checks passed. Mobile tests, typecheck, lint, Expo compatibility and Android Hermes export passed. Owner-tool tests cover synthetic key rejection/success, real encryption readback and tamper rejection. These checks do not replace real-device acceptance, authenticated live role-by-role flows, a true concurrent transaction test, a certificate-renewal rehearsal or a restore into an isolated Supabase target.

The old application checkout is `/var/www/wedding-market.before-20261019-185347`. The old Nginx site is under `/var/backups/wedding-market-nginx/20261019-190539`. These are rollback aids, not independent database/media backups. Keep the audit SSH account until the remaining approved work is complete, then remove its access through the owner.

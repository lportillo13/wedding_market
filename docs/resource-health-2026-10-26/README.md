# Resource health and data access

Measured October 26, 2026. Digital Wedding was reviewed read-only; no DW service, database or source was changed. Its useful patterns are foreground refresh, lightweight pages, bounded memory, invalidation after writes, and verified build retention. Wedding Market keeps its existing R2 image delivery rather than adding DW's Cloudinary proxy/cache infrastructure.

## Current capacity

The shared host has four CPUs, 8.13 GB RAM with 6.78 GB available, about 65.37 GB disk available, and negligible load at the observation time. The restricted audit account cannot measure private release contents; partial `du` results are not valid release sizes. Two managed Wedding Market releases existed before this release. These are point-in-time counters, not a load test or a capacity guarantee.

The Wedding Market Supabase organization reports 0.06/5 GB egress, 35/500 MB database allocation, 0.05 GB log ingestion, 0.00 GB log-query scanning, one monthly active user, and one peak Realtime connection. Dashboard counters can lag. PostgreSQL reports 19.84 MB physical database size, zero cumulative deadlocks and eight backends. Its statistics began May 7; cumulative scan/temp counters are not current rates. No customer rows or log searches were needed for this audit.

## Budgets enforced in code

| Work | Budget and behavior |
| --- | --- |
| Public directory | Public anonymous projection only; 30-second process-local JSON cache; 64 entries / 2 MiB UTF-16 payload+key ceiling; 16 concurrent distinct misses; shared in-flight reads, independent copies, no error caching or timers. Successful web profile/publish/media/review changes invalidate the cache and retire pending fills. Other processes/direct database writes expire within the TTL. CDN cache headers remain separate. |
| Web conversation refresh | 30 seconds while visible and online, with five-second wakeup cooldown and no overlapping React refresh. Previously every 15 seconds. Drafts remain in the current page. |
| Native inbox | 60-second list refresh / 30-second selected-thread refresh while active. Resume is coalesced; ordinary refreshes cannot overlap initial/manual work. Unchanged summary revisions skip full history reads and read-marker writes. Own writes force detail refresh. No shared private cache was introduced. Previously list plus selected history refreshed every 15 seconds. |
| Notification mailbox | SQL search/counts and stable 50-row pages; active/deleted folders remain separate. Searches include title, body and JSON data, with literal wildcard characters and a 200-character input bound. Autocomplete uses the current page. Bulk actions retain their existing whole-folder semantics. Previously every page downloaded the entire mailbox, including the other folder. |
| Media, preserved | Three admitted uploads; bounded 55 MiB multipart stream / 30-second read; image/video input and decode limits; one Sharp thread, 32 MiB Sharp memory cache, bounded ffmpeg execution. Existing media size/concurrency tests still pass. |

The new mailbox function is `SECURITY INVOKER`, explicitly filters `auth.uid()`, keeps RLS, fixes its search path, and denies anonymous execution. Migration `202610260008` is additive; application rollback leaves it safely installed. Its normalized recorded source MD5 equals the repository source. Do not replay the schema baseline over production.

Synthetic cache verification merges twenty simultaneous identical reads into one loader call; expiration, eviction, oversize/error bypass and stale-fill invalidation are exercised. The configured intervals reduce scheduled refresh opportunities from four/minute to two/minute for a conversation and one/minute for a native list. This is a deterministic schedule comparison, not a measured production egress percentage.

## Build retention

The installed deployment helper preserves every clone/build and cannot be replaced by an app release. [The separate owner retention helper](../../deploy/maintenance/owner-release-retention.py) is prepared and planner-tested, but **not installed or executed on the server**. It defaults to dry run, shares the deployment lock, requires a successful receipt matching the active release, preserves the active and verified rollback paths, skips releases younger than 24 hours, running processes, revision mismatches, and unfinished Git work, and considers only strictly named managed release directories. It never touches DW, original checkouts, media, database records or backups. Owner installation is required for root maintenance; do not broaden the audit account's sudo permissions. Keep this pending item explicit until installed and observed.

## Operational practice

Use Supabase Usage plus aggregate PostgreSQL counters for routine resource questions. Do not leave Logs Explorer polling or repeatedly scan broad log ranges. For an incident, start with a short, service/route/status-filtered window. Preserve security logging. No paid plan, server resize, database pool, background worker or recurring monitor was added.

Evidence is sanitized in the adjacent JSON files. Deployment/public checks will be recorded after release. Root checks: 74 web tests, 28 PostgreSQL checks, native type/lint and 49 tests; production build and architecture checks pass. Signed native device validation remains separate.


## Verified follow-up

The resource release `b768471d2c81ba484887676838382cc0ca391b49` has its exact receipt/public checks in this folder. Launch-preparation revision `60a491a7f2b3d0b6cf9d16fcfba8c4476d69b31a` is now live; see the [current handoff](../mobile-launch-2026-10-26/README.md). Its neutral PWA cache replaces personalized HTML/unbounded bundles; the static offline page remains free of edge-injected scripts. Native auth refresh now follows app visibility. There is still no new polling worker, paid plan/mail subscription or server resize. The owner plans the reviewed root-retention dry run; output/activation remain pending, so no automatic cleanup is claimed active.

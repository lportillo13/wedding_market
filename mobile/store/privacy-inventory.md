# Privacy engineering inventory — October 26, 2026

Publisher: **PORTILLO'S DESIGN CR LLC, Florida, United States**. Support/privacy/deletion/abuse contact: **hello@thewedmarket.com**. Free Cloudflare forwarding to the owner's verified inbox is active; the owner confirmed actual inbound delivery. No paid Hetzner mailbox was ordered. This inventory informs the store forms; it does not substitute for reviewing the final native artifact and console questions.

| Data | Purpose and disclosure |
| --- | --- |
| Name, email, phone, contact country, language, role | Authentication/profile and selective contact sharing. Contact country is not destination or device geolocation. |
| Wedding date, guest count, optional budget/theme | Planning, prefilling and inquiries sent to selected vendors. |
| Auth/session identifiers | Supabase authentication. Native currently persists through AsyncStorage; storage/backup hardening and signed-artifact verification remain a release gate. Do not claim device encryption from HTTPS alone. |
| Favorites, requests, proposals and private messages | Core functionality. Conversations remain private per selected vendor. Moderators can inspect a reported thread through MFA-scoped functions. |
| Vendor business details, prices, availability, team, reviews/media | Account management and public vendor content. Public content can be copied by others. |
| Selected images | User-selected uploads via Wedding Market API to R2. No device-wide photo collection, precise device location, camera or microphone feature. Camera/microphone permissions are disabled in source config; verify merged manifests. |
| Push token, platform, notification content | Optional delivery through Expo/APNs/FCM; verify credentials, revocation/logout and actual device behavior. Message previews may appear on the lock screen. |
| Reports, blocks, rules acceptance, deletion requests | Safety, access enforcement and account rights. Reports are private; recipient users cannot enumerate them. |
| Network identifiers, request/error/security information | Hosting/provider operations. Establish actual fields, access and retention from production configuration before console declarations. |

Known providers: Supabase; Cloudflare network/R2/Email Routing; Hetzner hosting; Google forwarded support mail and website fonts; Resend authentication/application mail; Expo/Apple/Google push. Public editorial pages also load external images. Map/share services receive data when used. Review production provider agreements and SDK behavior. No mobile advertising or cross-app tracking integration was found; sponsored placements remain off. Newsletter marketing remains optional and separate.

## Implemented controls and evidence limits

- EN/ES privacy, terms, support, community, cookie/storage and deletion pages use the confirmed identity/domain. Explicit `?lang=en` and `?lang=es` links support reviewers regardless of browser language.
- Web/native authenticated deletion initiation records an idempotent reference, status and 30-day deadline. MFA operators remove database content, bounded owner media, Auth identity, review CDN/backups, deliver confirmation, and only then finalize. Last-admin protection and stale-JWT rejection are tested. End-to-end provider delivery/cleanup needs an isolated operational drill before submission.
- Private reports, rate limits, two-way contact blocks, recorded posting-rules acceptance, deterministic first-pass text filtering and MFA moderation are implemented. Human handling of images/context and timely queue review are operational duties, not capabilities claimed for the small text filter.
- PWA CacheStorage holds only a fixed neutral offline page and icon. It removes old Wedding Market caches and never stores authenticated HTML, private API results, vendor navigations or unbounded JS chunks.
- Public directory cache is public-only, short-lived and bounded. Private/native inbox refresh runs only in the foreground; SQL pages avoid downloading the entire mailbox.

Consult the [operator runbook](../../docs/mobile-launch-2026-10-26/operations.md) and final deployment receipt/public checks before claiming the pages live. Complete actual Apple App Privacy, Google Data safety, rating/audience, app-access and trader forms from the final binary and production configuration; do not infer SDK collection or tracking solely from the absence of a direct dependency.

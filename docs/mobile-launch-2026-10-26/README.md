# Wedding Market launch preparation

**Current update:** [October 27 signed release preparation](../mobile-launch-2026-10-27/README.md) records completed app-specific credentials/store drafts and native session/permission hardening. Historical counts and missing-credential statements below are superseded there; public store release is still unverified.

Message/quote push preparation subsequently advanced: [current notification handoff](../message-notifications-2026-10-26/README.md) supersedes the earlier native test/archive counts and push configuration inventory below. Credential setup and installed-device acceptance remain open.

October 26, 2026. The owner approved the refined outlined WM identity, PORTILLO'S DESIGN CR LLC (Florida, United States) as publisher, and free couple/vendor accounts with service contracts/payments directly between couples and vendors. Sponsored placements remain off. `hello@thewedmarket.com` receives support/privacy/deletion/abuse mail through free Cloudflare routing; the owner confirmed delivery.

## Implemented preparation

| Area | Current result |
| --- | --- |
| Brand | Approved outlined SVG masters, licensed Playfair type, dedicated 1024 native icon, Android adaptive/themed layers, genuine white/transparent notification mark, splash, favicon ICO16/32/48 and SVG, Apple180 and PWA192/512/maskable. [Approved sheet](brand/production-candidate.png). Reproduce with `node scripts/generate-brand-assets.mjs`. Earlier concept boards are historical. |
| Store artwork/copy | [EN/ES listing copy](../../mobile/store/listing.json), Play512 icon and [1024×500 feature graphic](../../mobile/store/feature-graphic-1024x500.png). Real device screenshots remain outstanding; graphics are not screenshot substitutes. |
| Public pages | EN/ES privacy, terms, support, deletion, community guidelines and cookie/storage information; correct company/domain/email. Footer removes sample phone and generic store/social destinations. No public app availability is claimed before release. |
| Account deletion | Authenticated web/native initiation, confirmation, durable status/reference and 30-day deadline. MFA processing, bounded origin cleanup, Auth removal, CDN/backup review and confirmation delivery are required before completion. No customer account was deleted by this work. |
| Content safety | Recorded posting-rules acceptance, private rate-limited reports, two-way contact blocks, first-pass text filter and MFA moderation. Independent group-vendor bookings/conversations remain isolated. |
| Resource hygiene | Public-only bounded cache; foreground/no-overlap inbox refresh; fixed-size SQL pages; existing upload/media limits. Neutral PWA offline cache replaces personalized/unbounded caching. No new polling worker, plan upgrade or paid mail subscription. |
| Live directory | Exactly 152 seed-confirmed demo listings hidden and owners restricted with records preserved, as approved. Four unmarked published listings remain unchanged; their authenticity was not certified by this audit. Seeder now accepts only local database plus local Auth targets. |
| Database | Migrations 000–012 replayed; live catalog matches 355 columns, 91 constraints, 80 indexes, 113 policies, 55 functions and 8 views. Seed quarantine is separate from structural migrations. |
| Native source | Version1.0.0, existing identifiers preserved; warm palette/brand integrated. Camera/microphone disabled; auth refresh follows app visibility. Typecheck/lint/49 tests and online Expo compatibility passed; both Hermes exports passed. |
| Actual source archive | EAS25.2 archive inspection corrected directory allowlist semantics. Android/iOS archive contents must match the final source; auditor checks byte identity, bounded size, forbidden paths and known server-key markers. No signing/cloud build/upload is implied. |

## Digital Wedding lessons applied

Apple's five 2.1(b) business-model answers are prepared specifically for this free marketplace in [review notes](../../mobile/store/review-notes.md). Dedicated notification artwork and actual source archive checks address previous DW mistakes. Do not copy DW's web-hosting/payment explanation, package/signature assumptions or release state. Keep service/user data and deployments isolated from DW on the shared host.

Source checks, bundling, signed artifacts, physical acceptance, upload, processing, review, approval, public release and installability are separate milestones. Google managed publishing and Apple's manual release must be selected deliberately; EAS Android defaults to internal/draft. Do not create mock screenshots or put reviewer credentials into source/archives.

## Remaining release gates

1. Perform an isolated complete deletion and moderation drill with the production providers, including Resend confirmation, CDN and backup retention. Assign daily queue ownership and prompt abuse response; see [operations](operations.md).
2. Harden/verify native session storage and backup behavior; inspect all SDK privacy manifests and merged permissions. Review the outstanding Expo-tooling dependency advisories; do not force an incompatible SDK downgrade.
3. Verify EAS production public environment, app records/name availability, account type/testing requirements, signing ownership, push credentials and auth/recovery redirects. Keep private values outside source, documentation and archives.
4. Build signed production AAB/IPA; inspect actual Android target API/16KB compatibility and Apple SDK requirements, startup/icons/splash, privacy manifests and artifact contents. No new signed build or store upload has been performed.
5. Test Android, iPhone and supported iPad, both roles/languages: fresh install/upgrade, auth/recovery, permission denial, push in all states, media, slow/offline recovery, accessibility, deletion, report/block and independent bookings. Capture real native EN/ES screenshots with isolated fictional data.
6. Complete store metadata/privacy/data safety, rating/audience, access, countries/trader and review forms against the final artifact. Confirm manual/managed public release controls before submission.

[Validation](validation.md) records tests and evidence limits. The [launch audit](../../scripts/audit-mobile-launch.mjs) reports source checks separately from manual gates and deliberately never certifies store submission readiness. `npm run launch:audit -- --strict` under `mobile` remains nonzero while required evidence is open. The web/backend release uses the fixed restricted Wedding Market gateway. Verified live revision is `0052234b649f57f720480f56990f817e66916ae6`; the [exact receipt](deployment-success.json) and [public checks](public-release-checks.json) pass. Root maintenance installation is separately owner-only; the owner plans its dry run, with output/activation still pending.

## Official requirements

[Apple account deletion](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion/), [review guidelines](https://developer.apple.com/app-store/review/guidelines/), [Google account deletion](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en), [Google user data](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en), [Expo source archive inspection](https://docs.expo.dev/eas/cli/#eas-buildinspect), [Android page sizes](https://developer.android.com/guide/practices/page-sizes). Recheck console requirements when creating the signed candidate; historical preparation does not establish current console compliance.


## Verified website release

Public privacy, terms, support, deletion, community and cookie pages pass in both languages with the correct identity/email. Artwork/favicon/offline assets match source. The offline document sends no-transform and contains zero scripts; ordinary website pages retain disclosed Cloudflare aggregate performance measurement. Directory/API checks confirm4 unmarked listings and no seeded demos. A hidden demo detail API returns404; Next's streamed page renders the explicit not-found result without profile content. Protected endpoints and private inbox redirects remain protected, and direct-origin access is403.

Phone QA found no horizontal overflow at320/390px. The public-deletion page exposes sign-in and full-account instructions; authenticated lifecycle/provider and real-device acceptance are separately gated. Root retention is not claimed active from the owner's promise to run its dry run.

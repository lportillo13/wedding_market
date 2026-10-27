# Public launch acceptance — October 27, 2026

The owner now explicitly authorizes **public submission once the checks pass, with an empty vendor directory**. This supersedes the previous instruction to wait for real vendors. The apps remain in their existing private tracks while acceptance work is in progress. Do not claim public availability before store approval and a verified release.

Keep all confirmed fictional vendors hidden. Preserve the private, clearly identified store-review accounts and conversations so reviewers can exercise the workflows. Do not restore public test businesses, unsupported vendor counts or claims of verification.

The earlier [verified release handoff](../mobile-launch-2026-10-27/README.md) retains historical artifact hashes and private testing receipts. The current acceptance results below supersede its candidate and operational status.

Acceptance in progress:

- Actual native iPhone and 13-inch iPad EN/ES captures, with source and screenshot provenance. Use one isolated Expo macOS capture job and one simulator at a time, following the established Digital Wedding workflow. No customer or review credentials are needed for the public guest captures.
- Native capture execution is now complete: [verified provenance](ios-native-captures.json) records eight actual captures/six unique images, correct dimensions and EN/ES cold-start persistence. Upload and store validation remain separate.
- Message/quote delivery and tap routing, foreground/background/closed, opt-out/logout and account switching. Record provider acceptance separately from OS presentation and installed-app acceptance.
- Fresh signup callback, transactional email receipt, MFA moderation/deletion, scoped media/CDN cleanup and an actual backup/recovery/retention check. Never delete the store-review accounts or a customer as a fixture.
- Accurate store descriptions for the initial directory, final reviewer access, native assets and release controls. Public submission is conditional on the acceptance results; the owner has approved launching before vendors join.

The restricted deployment account cannot install root-owned helpers or read the production environment. Preserve that boundary and Wedding Market's isolation from Digital Wedding.

## Current acceptance — October 27, 2026

The website/backend is live at `25e8f7b6bb4964d2ac55f6a84e23185fc4303c56`: [exact deployment receipt](deployment-avatar-success.json). The public Auth callback no longer redirects to localhost, and actual bearer-authenticated avatar uploads work. Later commits in this section change the native app and operational tools; they do not claim another web deployment.

The owner installed separate approved Expo Viewer and domain-limited Resend senders. Only Wedding Market's private configuration/process was updated. See [push configuration](push-configuration.json) and [mail configuration](mail-configuration.json). Digital Wedding's credentials were preserved. The Expo robot's Viewer role is account-wide; it is used only for Wedding Market, as specifically approved. No paid service was added.

The encrypted database/media export has a verified [off-host ciphertext copy](offhost-database-backup.json). The owner-run [actual restore](actual-backup-restore.json) restored the application dump's `public`, `auth` and `supabase_migrations` schemas and an owned image, with ACLs, constraints and RLS checked. Its transient PostgreSQL instance had no network, was capped at 384 MiB/30% CPU, and stopped with its plaintext runtime removed. This proves application-dump recovery; it is not a full managed Supabase service clone. Daily backup and build-retention timers are enabled; [operational readback](server-operations-readiness.json) records their next runs. Build cleanup has not yet executed. Data-backup retention remains manual, distinct from build retention.

The approved disposable account completed MFA moderation/deletion processing. Its login is rejected, its previously cached image returns 404 after an exact-URL Cloudflare purge, and Gmail returned SMTP 250 for its [completion email](deletion-email-delivery.json). Both admin queues are empty. Store-review accounts were preserved. [Backup handling review](deletion-backup-review.json) records the retained encrypted snapshot and the requirement to reapply completed deletions before a future restore is reconnected to users.

All six unique genuine iPhone/iPad EN/ES screenshots are uploaded in Apple, with large-iPhone scaling supplied by App Store Connect. Guest captures retain [their original provenance](ios-native-captures.json). No mock vendor was made public. Both stores' descriptions explain the initially empty directory and free accounts.

Installed-app acceptance exposed a token-event feedback loop and a notification/inbox conversation-key mismatch. Source `b61025e3ca2eb9ad86a933edb48f9e5b99095756` fixes both. Native validation passes 75 tests/16 suites, type checking, lint and architecture checks. Final Android 10 passes [seven installed-app notification scenarios](android10-notification-acceptance.json): foreground/background/process-closed delivery, exact notice read markers and request-detail routing, warm opt-out, logout suppression, account switching with separate opt-in, and couple quote delivery/tap. The signed universal APK came from the inspected production AAB. Only private fictional fixtures were used; both test logins were signed out and the bounded emulator was stopped afterward.

Both final [iOS](production-ios-final-source-archive.json) and [Android](production-android-final-source-archive.json) source archives pass the strict file/hash/private-material checks; guest UI matches the genuine captures. Android 10 passes signature, SDK/API 36, permission, key and 16 KB ELF/ZIP checks. Google accepted its production bundle (16.6 MB estimated device download), and the EAS Android version counter reads 10. The missing deobfuscation-file warning is nonblocking: this build has release minification disabled.

iOS 7 finished on October 27 at 19:15:50 UTC and passes [IPA metadata/profile/privacy inspection](ios7-artifact-inspection.json). Its upload `794d50de-42b8-4030-a59f-7835a440913c` is queued in EAS for the existing Wedding Market App Store Connect record and owner-only TestFlight group. The obsolete iOS 6 upload is confirmed cancelled. Do not select iOS 5 or 6 for public review. No physical iPhone was available: APNs presentation on a physical device remains unverified; signed entitlements/provider credentials and shared notification rules were checked. Do not describe simulator captures as physical push acceptance.

The isolated reviewer vendor password was rotated again after diagnostic exposure, old refresh sessions revoked, and the replacement login verified. Both Apple and Google reviewer-only fields were updated and saved. Google's save acknowledgement and refreshed access instructions were verified. Credentials and raw Auth links belong only in protected private storage and specifically approved reviewer fields, never in this handoff.

Android 10 and 11 associated listing/policy changes were submitted for public review. Google shows **Changes in review**, with automatic quick checks running before review. Managed publishing is off, so approved changes can publish automatically. The launch targets 176 currently selected Google markets, excluding mainland China and the open-ended Rest of World option. Apple's approved scope remains 174 storefronts excluding mainland China. Neither public availability nor Apple's public review submission is established yet. See [Google's submission receipt](google-public-submission.json) and [live public route checks](public-final-release-checks.json).

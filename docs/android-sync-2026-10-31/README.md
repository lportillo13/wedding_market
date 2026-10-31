# Website and Android update — October 31, 2026

The owner requested that the website changes also be present in the app and that
the Android version be updated in Google Play. This authorizes the new Android
release and supersedes the earlier native hold for Android. Apple's submitted
binary and manual-release control remain outside this task.

The comparison starts with published Android **1.0.0 (10)**, source
`b61025e3ca2eb9ad86a933edb48f9e5b99095756`, and the website releases through
`4cbc0f9441be7962130199d0e9294e956f7577bb` plus their current handoffs. The release
submitted update is **1.1.0 (12)**. Build, installed-app and store receipts below are
recorded separately; a source change or successful export is not publication.

| Website change | Android treatment |
| --- | --- |
| Approved warm editorial styling and fonts | Includes the previously held GT Super/Lucia/Acumin native design across the app, new image-overlay directory cards and centered profile covers. The owner explicitly confirmed app-embedding licenses on October 31; original font provenance remains intact. |
| Google/Apple access, email codes and valid persistent sessions | Native system-browser PKCE, exact app callback, secure session storage, password login compatibility, code retry/resend, provider capability checks and one-use callback deduplication. PKCE password recovery keeps its recovery event. |
| Verified couple onboarding and final review | Starts at the first missing required detail, retains verified identity, omits another password, keeps estimates optional and a zero budget valid, and saves only after explicit review. A requested quote resumes after access/setup. |
| Vendor onboarding and consent repair | Native role choice, verified owner/contact, business/category/location steps, review and recorded terms before private draft creation. Existing vendors reuse their business; failed setup can resume. |
| Messages-first account navigation | Direct inbox action and own-account unread count. Counts use HEAD requests on foreground/navigation/activity; no idle timer or notification-row preview fetching. |
| Personal profile across account roles | Vendors keep separate business and personal destinations. Contact-country selection, locked credential email, optional planning estimates, numbered sections and an explicit choose/upload photo flow are retained. |
| Vendor Business studio | Compact section selector, essential tasks, independently retained section drafts, separate starting-price save, category/location/publication controls and a private saved-data preview for unpublished businesses. Contact saves cannot clear starting price. |
| Vendor cover media | Photo, saved uploaded video, YouTube/Vimeo or HTTPS video selection; uploads keep the existing 50 MB limit. Direct video uses muted native playback, pause, reduced-motion support and background/offscreen pausing. Hosted YouTube/Vimeo videos open their provider. |
| Profile inquiry design and access | One floating quote action after the cover, hidden at the final inquiry action. Guest prices require sign-in; vendor/admin accounts get a clear couple-account notice. Native section navigation includes the cover offset. |
| Boutique stores, favorites and appointments | Includes the held native boutique catalog, outfits, favorites, visit requests, owner management and appointment inboxes, using the same existing APIs and shared rules as the website. |
| Vendor introduction, magazine, about and support | Bilingual entry points open the corresponding maintained website pages. Editorial pages and platform moderation keep their web presentation; core account/vendor/inquiry flows remain native. No free-pricing promise is introduced. |
| Existing safety and booking rules | Independent vendor bookings, private threads, atomic inquiry creation, proposal revisions, reporting/blocking, deletion and foreground notification behavior remain in place and retain their regression tests. |

Two small website APIs support the app: bounded signup-email availability reuses
the existing limiter and service-only lookup; authenticated vendor workspace
commands derive ownership from the verified session, retain RLS and invalidate
the public directory after native saves. They do not accept an arbitrary vendor
ID, cache private results, change database structure or alter the separate DW app.

Website deployment is complete at
`873bb557838f0742f4c4a29ca335e64f7d955435`; the fixed gateway's
[successful receipt](deployment-success.json) matches that exact target. The
rollback copy is `/var/www/wedding-market.before-20261031-043209`.
[Public verification](public-checks.json) and
[isolated authenticated API checks](review-api-checks.json) pass. No database
migration was required.

Android **1.1.0 (12)** was built from
`4620fccd85b35c11df16f4c2f8b642440c07f2b3`. Its 54,151,495-byte signed AAB has
SHA-256 `1aeb70c8352c7d04fb12afa31f8b801a57aabe77d039e7cf2666673070e125a6`.
The [source archive](source-archive.json) has no missing, extra, changed or
sensitive files; the [artifact inspection](artifact-inspection.json) confirms
the existing upload key, API 36, all 32 inspected 64-bit libraries and ZIP
alignment at 16 KB, disabled backup/debugging and no unnecessary sensitive
permissions. Its 24 permissions match published build 10. Build 11 was removed
from the release selection before submission and remains only in the artifact
library. EAS's Android counter was independently read back as 12.

The [native checks](native-validation.json) pass: TypeScript, lint, **93 tests**,
Expo compatibility and launch audit. The
[website/source/database checks](web-source-validation.json) pass, including
165 application tests, 49 database tests and architecture inspection. The
[production build](web-build.json) and both
[production exports](exports.json) pass. [Dependency audit](runtime-audit.json)
still reports tooling advisories; no incompatible forced upgrade was applied.
The final Android production map contains no Zod validator modules.

Google Play accepted build 12 for the production release, with EN/ES notes,
100% rollout and the existing targeted countries. No previously supported
devices are lost. The only release-preview warning is the absent R8 mapping
file; minification is disabled in this build, so there is no generated mapping
to upload. Installed checks are recorded
in [the installed acceptance record](installed-acceptance.json), including their
scope and limits. The isolated couple draft was not saved and the vendor remains
unpublished. English/Spanish public captures are stored alongside this handoff.

**Submitted to Google Play:** the final authenticated readback shows **Changes
in review**, with build **1.1.0 (12)** and **Start full rollout**. Managed
publishing remains off. Google's quick checks were still running; the console
queues review automatically after they pass. Approval and public availability
are pending, so published build 10 remains the last independently verified live
version. [Exact submission record](google-play-submission.json). No manual
release step is needed after approval with the current publishing setting.

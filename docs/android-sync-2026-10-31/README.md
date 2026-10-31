# Website and Android update — October 31, 2026

The owner requested that the website changes also be present in the app and that
the Android version be updated in Google Play. This authorizes the new Android
release and supersedes the earlier native hold for Android. Apple's submitted
binary and manual-release control remain outside this task.

The comparison starts with published Android **1.0.0 (10)**, source
`b61025e3ca2eb9ad86a933edb48f9e5b99095756`, and the website releases through
`4cbc0f9441be7962130199d0e9294e956f7577bb` plus their current handoffs. The release
candidate is **1.1.0 (11)**. Build, installed-app and store receipts below are
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

Validation in progress: [native checks](native-validation.json),
[website/source/database checks](web-source-validation.json),
[production exports](exports.json). Installed-app acceptance and exact store
submission will be added after the candidate is built. No publication is claimed
by this preparation record.

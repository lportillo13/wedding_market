# Code and implementation review

October 19, 2026. Reviewed from local commit `749095f7` on `codex/audit-remediation`, following the earlier security and infrastructure remediation. The owner requested a review of how the code works and implementation improvements where justified.

This change set is local source, validated with tests and builds. The running production application remains release `60cbcb5085d71b60100fa5c91e52b99079001740`. These changes need deployment and a new mobile development build before users receive them.

## Assessment

The existing separation between the Next.js app, native app and PostgreSQL authorization rules is useful. Keep database ownership and state checks authoritative, pass the caller's Supabase session into domain operations, and keep routes and server actions responsible for transport and cache invalidation. Business rules duplicated between two server entry points were the clearest immediate maintenance problem.

Reviewed the request-authentication clients, upload authentication and browser transport, quote submission/replies/acceptance, RFQ creation, notification persistence and delivery, date rendering, inbox loading and shortlist retrieval. The earlier database policies and atomic booking/media/section functions were checked against the new callers. This is a focused implementation review; it is not an exhaustive proof that every route or third-party integration is defect-free.

## Changes

| Area | Problem found | Implemented improvement |
| --- | --- | --- |
| Quote workflow | Web actions and native routes maintained separate copies of ownership checks, invitation checks, persistence and notifications. Archived requests were not checked consistently in the application. | `lib/quotes/submit.ts` is the common server workflow. Web and native entry points authenticate and pass their RLS client into it. Ownership, closure/expiry, accepted-state checks and response behavior now agree. PostgreSQL still rechecks authorization and allocates versions. |
| Quote prices | The web parser stripped minus signs and arbitrary characters. The native API accepted amounts beyond the database integer column's range. | One server schema and strict USD parser reject negative, malformed, fractional-cent and overflowing input. The maximum is the actual PostgreSQL integer bound, 2,147,483,647 cents. Mobile preflight uses the same format and bound. |
| Saved actions and notifications | A rejected external delivery could reject a notification call after the business action and notification had already been saved, encouraging a duplicate retry. | Delivery channels settle independently. Database transport failures become notification errors; language lookup has a safe fallback. Shared quote submission preserves success after persistence when optional activity or notification work fails. Push-provider response bodies are no longer logged. This is not a durable delivery queue. |
| Authentication | The request-client factory verified a cookie user and each route immediately verified it again. Uploads repeated verification after parsing the body; push registration had a separate cookie/bearer implementation. | One request-client factory selects the bearer or cookie context; the caller verifies the user once. Upload branches reuse that validated context. Push registration uses the same factory. Native bearer requests include the public API key and take priority over cookies. Admin website uploads retain their separate MFA authorization check. |
| Upload/browser networking | An HTML proxy error caused an uncaught JSON parse exception inside the XHR load listener, leaving the returned promise pending. There was no upload timeout/cancellation handling. Mobile JSON transport replaced a caller's abort signal. | Upload responses now resolve or reject on success, malformed JSON, HTTP errors, network failure, timeout or cancellation. A default three-minute upload deadline and optional caller signal are supported. Mobile JSON requests forward cancellation, distinguish it from their own deadline, and remove timers/listeners. |
| Wedding dates | Parsing a date-only string as a timestamp could display the preceding day in Costa Rica or other western time zones. Impossible calendar dates reached the database. | Date-only parsing and UTC formatting preserve the selected calendar day in web inboxes, request summaries and mobile thread summaries. Invalid dates fall back safely, and RFQ validation rejects impossible days before a write. Timestamp-based activity labels retain their existing behavior. |
| Shortlists | The client sent every saved ID to an API capped at 50 IDs. Malformed local storage could be accepted as an array and crash list operations. | Summary retrieval uses sequential batches of at most 50 and deduplicates IDs. It preserves cancellation and stops on failure. Saved shortlist reads validate array/string shape, trim IDs and remove duplicates. |

The quote workflow uses the versioned current schema directly, instead of maintaining legacy owner-column and missing-thread-column retries inside both submission paths. The database baseline and migrations already establish these columns. This change does not require another migration.

Web and mobile keep independent dependency/build configurations. The small calendar and amount preflight helpers in the native app are covered separately; authoritative quote validation runs in the shared server workflow. No new cross-project Metro resolution or package-manager setup is required.

## Validation

- Web: typecheck, lint and production build passed. The final suite passes 41 tests, including real-Supabase-client tests with synthetic HTTP responses for the shared workflow and bearer headers.
- New regressions cover missing ownership, archived/expired/accepted requests, a database denial during save, post-save metadata/delivery failure, malformed/overflowing prices, invalid calendar dates, time-zone-safe rendering, proxy upload errors, cancellation and large shortlists.
- Database: all 17 existing PostgreSQL/PGlite authorization and transaction regression checks pass. Synthetic fixtures are used; these are not customer-data tests or a true concurrent multi-connection test.
- Mobile: the full 41-test suite, typecheck and lint passed. After adding the year-zero edge case, all six date cases passed again and the final changed helper passed lint. The updated source exported successfully to a 2.8 MB Android Hermes bundle. Expo's dependency check used its installed SDK map because networking was disabled during that check; dependencies were not changed in this review.
- Local production smoke checks: health, login and the vendors page returned 200. Five mutation endpoints returned 401 for unauthenticated malformed JSON, before body validation or database writes. All checked responses included `nosniff`.
- Data-backed local directory lookup returned 503 because `.env.local` targets the offline local Supabase instance at `127.0.0.1:54321`. Its graceful error response was confirmed. This is an environment limit, not a passing live-data integration test. Local configuration was kept intact.

The local smoke server uses an ordinary Next production start for validation. Deployment continues to use the reviewed standalone release procedure and its asset/environment copying. Production and external credentials were not modified for this code review. Authenticated browser acceptance and real-device testing remain deployment checks.

## Architecture work to plan separately

The following changes need their own behavior, schema and recovery tests:

1. RFQ creation and its invitation batch should become one database transaction. The current route compensates with a delete when invitation insertion fails; a transaction would remove that intermediate state and support explicit idempotency.
2. Reliable notification delivery needs a persisted outbox, bounded workers and retries. This review isolates delivery failures but does not guarantee delivery through a process crash or a long provider outage.
3. Individual conversation history should have cursor pagination. Inbox list summaries are already paged; loading a long selected thread can still reach the existing REST result limit.
4. `mobile/App.tsx` can be divided into feature screens and state hooks once screen-level acceptance coverage is established. Moving thousands of lines alone would not establish correct state transitions; keep that work separate from this tested workflow change.

The outstanding database backup/password, SQL network restrictions, SSL enforcement and bucket-scoped storage credential work remains recorded in `audit-2026-10-19/finding-status.md`. This code review does not close those infrastructure items.

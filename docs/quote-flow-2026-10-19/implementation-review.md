# Inquiry, proposal and messaging workflow review

The owner clarified that the work must cover behavior: individual requests, group requests, vendor/client conversations, proposal revisions and acceptance. This release reviews and fixes those flows across the website, shared backend and native source.

## Findings and fixes

| Finding | Resulting behavior |
| --- | --- |
| Request creation was duplicated across API and server actions, with separate brief/invitation writes and compensating deletes. | All entry points use `createInquiry` and the invoker-authority `create_inquiry` transaction. A brief and its 1–10 invitations commit together. Failed groups leave no partial request. |
| A single-vendor submission could silently overwrite an earlier pending request, and retries could create duplicates. | Only an explicitly selected editable request can be updated. Answered, messaged, archived, expired and accepted requests are protected. New web/native submissions keep a UUID retry token; the database validates a normalized payload fingerprint. |
| Neither side could ask a question before a proposal existed. | Messages are attached to the inquiry/vendor pair. The historical quote link is optional; existing history is backfilled, retained and supported for old callers. Each group vendor sees only its own messages. |
| Web and native reply/acceptance logic differed and optional delivery failures could make a saved operation appear unsuccessful. | Shared message and acceptance services validate transport, persist under the caller's RLS context, and preserve success after optional notification failure. Repeated acceptance does not send another notification. Message retries acknowledge an existing matching actor/body/thread rather than duplicating it. |
| A previous proposal could be accepted after a revision, and editing, sending and accepting could race. | PostgreSQL locks the inquiry before revisions, messages or acceptance and allocates versions per thread. Acceptance and the direct booking guard reject older versions. |
| Archived threads still exposed send/accept controls. Accepted follow-up and invitation expiry were not handled consistently. | Shared web state and corresponding native checks hide invalid actions. Booked conversations remain usable after the original invitation expires, unless archived. Closed client threads link to restore or a fresh inquiry. |
| Consecutive successful replies did not reliably reset the composer; failed actions could reset uncontrolled fields. | Controlled reply/proposal drafts survive errors and background refreshes. Each successful reply clears its text/count. Inputs are held while sending; contact-sharing choices are held while accepting. |
| Incoming activity needed a manual refresh; native reads did not clear web unread markers. | Visible web inboxes/threads and foreground native inboxes refresh periodically and on return. Opening a conversation updates the relevant read marker. Web lists show unread indicators. |
| Empty/deleted folders lost their other-folder counts. Search ignored conversation text, and long history could hit one REST page. | The versioned summary RPC retains counts when a page is empty, searches authorized messages/proposals and supports old readers separately. Selected history loads ordered, thread-scoped batches of 200. |
| Prices with cents were displayed as whole dollars; native number parsing could change malformed values such as `-20` or `12.5`. | Proposal amounts retain cents. Required guest counts, optional zero budgets, real calendar days, vendor limits and PostgreSQL integer bounds are validated. Malformed numeric input is rejected. |

Migration: [202610190006_inquiry_conversations.sql](../../supabase/migrations/202610190006_inquiry_conversations.sql). It adds thread identifiers to existing messages, preserves the previous message rows and optional proposal link, and keeps the old summary RPC compatible. New writes remain limited to authenticated thread participants. Contact consent masking is retained. No credentials, external account permissions or infrastructure settings change.

## Validation

The shared workflow tests use the real Supabase JavaScript client with synthetic HTTP responses; PostgreSQL/PGlite tests execute the actual migration, policies, triggers and transaction functions. Browser checks use the actual reply/proposal components with fictional records: failed send retention, consecutive successful clears, Spanish feedback, phone layout, exact fractional price and draft retention through repeated background refreshes. The temporary preview route is removed before building the release. [Phone preview](preview-mobile-es.png) contains example data.

The native source passes typecheck, lint and 48 tests, including group payload/retry tokens, pre-proposal messages, malformed numbers and closure checks. A final native-only correction clears the submission token after a confirmed request, so a later identical inquiry can start a new conversation; the native checks and export were repeated afterward. The Android Hermes export compiles successfully. This is source/build validation; a new native binary is not published by the website deployment.

The final production build passed with no preview route. All 62 web tests, 24 PostgreSQL/PGlite checks, web typecheck and lint pass. The [rollback-only live verification script](live-transaction-check.sql) passed against the production Supabase database: [result](live-workflow-verification.json), [screenshot](live-workflow-verification.png). It checked individual/group creation, deduplicated retries, private messages before proposals, empty-folder counts, proposal versions, stale-acceptance rejection, acceptance retries, contact masking and accepted follow-up after invitation expiry. All fixture records were rolled back. It called no email/push delivery code. Its rollback behavior is also exercised in the local database suite.

The [migration integrity check](migration-verification.json) confirms version 006 is recorded with the reviewed SHA256, all 13 historical messages remain valid, both new privileged functions deny anonymous execution and no fixture accounts remain. [Migration completion screenshot](migration-success.png).

## Product rule and practical limits

Existing acceptance behavior remains one winning vendor per inquiry, closing its competing offers. The client sees that consequence before accepting and can compare the request's proposals. The owner was asked whether mixed-service group requests should instead book services independently; that decision is pending and was not silently changed.

No real client/vendor login credentials were supplied for browser acceptance. UI scenarios are fictional; database role checks are separate from a signed-in two-account browser test. Notification failures no longer corrupt action results, but there is no durable delivery outbox. Ordered history uses bounded REST batches while rendering the selected thread's complete history. Database checks are transactional, not a simultaneous multi-connection stress test.

## Release status

Migration 006 is applied and independently verified. Application `ef0975b0ac58adf2d66ff57beacc3813fa4d3af6` is deployed through the installed gateway from verified live base `21e91da8975ce008e36c2134e22ab24933dc8e72`. Manifest SHA256: `9b3e315673b46d4ae51dc88bd3da5506db00aa2d31e30e4b94c3eb2774bc8f86`. The service exited successfully and the [exact-release receipt](deployment-success.json) confirms `applicationDeployed: true`, step `complete`, and successful shadow/live probes. Rollback copy: `/var/www/wedding-market.before-20261019-225149`.

[Independent public checks](public-release-checks.json) passed: health, homepage, vendor directory/profile, bounded directory results, protected request/quote/reply/acceptance APIs, account/vendor login gates, new CSS assets, security headers and direct-origin rejection. The final native-only token correction does not alter the deployed website runtime; it is included in the source for the next native build.

For an application rollback, preserve migration 006 and the message history. Old quote-linked writers remain supported. A preceding application reader does not show newly created pre-proposal messages; restoring the fixed reader makes that retained history visible again. Do not drop the new thread identifiers or restore the old `quote_id NOT NULL` constraint over newer messages.

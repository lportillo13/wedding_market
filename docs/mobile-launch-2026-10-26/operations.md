# Launch operations — Wedding Market only

## Ownership and daily work

The operator is PORTILLO'S DESIGN CR LLC. Monitor `hello@thewedmarket.com` in the verified destination inbox. Forwarding is inbound routing, not a sending mailbox; configure an authenticated sender before sending replies as that address. Do not use Digital Wedding credentials or change its services. Assign a named operator before app submission. This release adds no background worker or idle queue polling.

Check MFA admin **Account deletion requests** and **Content reports** each working day; prioritize imminent threats immediately and promptly review other reports. The queue shows the oldest 50 open records; continue until reviewed. A request's 30-day deadline is a service commitment and must not be allowed to expire. Record only minimal operational references in a private access-controlled log; never copy messages, tokens or credentials into the repository.

## Account deletion

1. The account holder signs in and confirms full-account deletion in app or `/account-deletion`. This creates one idempotent request with reference/deadline; an email request is not required. Customer data remains accessible until processing begins, as the page explains.
2. A different MFA administrator opens `/private-control-room-hub/account-requests`, verifies the saved request, checks for a specific legal hold and confirms the destructive step. Never use a real customer as a test fixture. The last administrator cannot be removed without another administrator.
3. Processing first atomically purges the profile/dependent database content and records exact `clients/<user-id>/` and `vendors/<user-id>/` media jobs. Private stale JWT access is denied. Other vendors' independent bookings remain intact. Retry drains at most 20 objects per owner prefix per action; incomplete work is never marked finished. Login removal follows successful origin-media cleanup.
4. Once the UI reports origin cleanup completed, purge the deleted media URLs/cache copies in the Wedding Market Cloudflare media zone. Review all retained backup/recovery copies and any lawful exception. Establish a documented real backup expiry policy before submission; do not invent a duration. Keep isolated recovery copies inaccessible for ordinary serving and reapply deletion records if restoring a backup.
5. Only after those checks select the final-review checkbox and process again. A confirmation email accepted by the sending provider is required before the completion receipt is recorded and its contact email/owner ID cleared. Email/provider failures leave retryable status. Do not claim completion while an exception or provider failure is unresolved. If the original inbox is unavailable, privately verify an alternative completion channel before resolving the case through a reviewed support procedure.

The implementation's final completion email says active-service data was deleted and refers to the privacy policy for isolated backups. Separate vendor contracts are not cancelled. Do not add a new email-only completion requirement for the customer.

## Content reports and blocks

Open `/private-control-room-hub/moderation` with MFA. Review only the selected reported thread (latest20 messages) or listing. The database verifies the moderator's scope for message removal. Resolve/dismiss after review, unpublish the reported listing, remove the specified message, or restrict the reported account as appropriate. A report alone is not proof. Restrictions prevent posting/private app access and unpublish owned vendors. Record reason/context privately and handle appeals at the support address.

The small deterministic text filter handles a few obvious prohibited strings; it does not classify images or replace human review. Blocking is directional/private but prevents new inquiries, proposals and messages in both directions. It does not erase history, cancel agreements or block another vendor's independent thread.

## Required isolated operational drill

Before submission, create approved fictional client/vendor fixtures on the actual intended review backend, with no real customer contacts. Verify rules acceptance, public listing report, selected-thread report, block/unblock, MFA scope, removal and suspension. Verify deletion request retries, status/deadline, media batches and full R2 removal, Auth deletion/stale-token denial, CDN expiry, backup handling and actual confirmation receipt. Preserve minimal aggregate results and artifact/source IDs. Credentials belong only in approved private storage and console app-access fields. Device-level EN/ES acceptance remains separate from database/unit tests.

## Resources and retention

Use aggregate Supabase Usage/counters for routine checks. Avoid broad repeated Logs Explorer scans. Keep public JSON caches bounded and private sessions isolated. Preserve fixed-size mailbox pages, foreground refresh and existing media admission/time limits. Do not add a polling worker without a concrete measured need.

Reviewed root-only release retention is prepared under `deploy/maintenance`; it preserves active plus verified rollback releases and avoids dirty/in-use/new releases. The audit deployment account cannot install root helpers. After deployment the owner must hash-check/run the installer from the root terminal; it defaults to installation plus dry run. Review eligible paths before enabling `wedding-market-retention.timer`. It is **not installed or active** merely because source exists. Keep Digital Wedding, media, databases, backups and the original checkout outside this cleanup.

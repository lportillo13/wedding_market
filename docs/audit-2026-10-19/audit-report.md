# Wedding Market security database and resource audit

> Historical assessment before remediation. For deployed fixes, verification and remaining work, read [remediation-progress.md](remediation-progress.md). Findings below describe the original audited state.

Audit date: October 19, 2026. Source baseline: branch `dev`, commit `07f4f489c108fc850d6f7c22292d3a328c3fe747`.

The live audit confirmed two critical database authorization failures: six tables allow anonymous writes without row-level security, and ordinary accounts can change their own profile role to `admin`. A publicly granted owner-executed view also exposes private proposal fields. These need attention before additional production use.

**Status: read-only source, dependency, public HTTP, live Supabase, SSH, R2 and Hetzner audit completed, with verification limits below.** The correct project is **WedMarket** (`aousexbvujjnvbudpsmz`) in **CR Wedding Destination**. Production was inspected through a dedicated unprivileged SSH account; the owner ran a separate reviewed script for protected configuration. No exploit writes were used to establish the findings. The audit found no immediate capacity or quota pressure.

Production already contains dependency patches and R2 ownership guards that are absent from Git. The server's selected Supabase credential nevertheless returns `401`. Supabase's Free plan provides no scheduled project backups; Hetzner automatic backups are disabled and no server snapshots exist. Recovery testing, real-device behavior, and a full authenticated role-by-role penetration test were not performed.

## Coverage and evidence

| Area | Completed work | Remaining production checks |
| --- | --- | --- |
| Source security | Authentication, admin guards, API routes, uploads, storage deletion, notifications, and relevant mobile services reviewed | Authenticated client/vendor/admin behavior on the deployed revision |
| Database | All 29 public relations, 71 live policies, grants, views, functions, triggers, 58 indexes, 70 constraints, aggregate statistics, extensions, Auth settings and backup availability reviewed | Restore rehearsal; non-destructive client/vendor/admin integration tests in a dedicated test environment |
| Dependencies | Web/mobile registry checks; live installed packages, lockfile and uncommitted security patch reviewed | Reachability of mobile toolchain findings in the released APK; reconciliation of production patches into Git |
| Resources | Own-project billing-cycle usage; database size/connections; server CPU, RAM, disk, swap; R2 totals/lifecycle/token permissions; hosting backup/snapshot controls; polling and query projections | Peak load measurements; object-by-object orphan reconciliation; mapping the deployed R2 key to the displayed token |
| Public deployment | Anonymous HTTP checks, direct-origin HEAD and HTTP redirect; host/cloud firewall, SSH policy, PM2 startup/status, TLS/renewal controls, edge TLS/rules, Nginx/log controls and cached update status | Successful restore and certificate-renewal rehearsal; full detector internals and peak-load behavior |
| Verification | Web typecheck, lint, 20 tests and production build; mobile typecheck, lint, 28 tests, Expo compatibility and Android export passed | Real-device release testing and tests of live database authorization |

Only documentation and audit utilities were added to the repository. Read-only scripts and their output were placed in the dedicated audit account's home. No application/database fixes, credential changes, service restarts, load tests, exploit writes, or customer-row exports were performed.

## Critical and high-priority live database findings

### DB00 Anonymous callers can change six tables

**Priority P0. Confirmed live catalogs.**

`amenity_lookup`, `languages`, `vendor_amenities`, `vendor_pricing`, `vendor_spaces`, and `vendor_team` have RLS disabled. The `anon` role has schema usage plus SELECT, INSERT, UPDATE, and DELETE grants on every one of these tables. An application ownership check cannot protect direct database/API access. Existing foreign keys constrain some values but do not establish the caller's authority over the affected vendor.

Revoke unnecessary anonymous writes, enable RLS, and add explicit ownership checks for vendor changes. Lookup tables should have public read access only, with writes restricted to an authorized administrative path. Verify both web and mobile saves using two independent vendors before releasing the policy change. Merely enabling RLS without compatible policies would break legitimate editing.

Evidence: [production-anonymous-grants.json](production-anonymous-grants.json), [production-database-metadata.json](production-database-metadata.json), schema usage in [production-security-metadata.json](production-security-metadata.json).

### DB01 Ordinary users can promote their own profile to admin

**Priority P0. Confirmed live privileges, policies, constraints, and absence of a protective trigger. No account was promoted.**

Authenticated callers have INSERT and UPDATE privileges on `profiles.role`. The self policies check only `auth.uid() = id`; the role constraint explicitly permits `admin`; there are no non-internal triggers on `profiles`. The application trusts this database column in `requireAdminUser`, while live vendor/blog administration policies also trust it. An ordinary authenticated account can therefore assign itself a role that the application treats as administrative. The currently invalid server credential does not protect database operations authorized through the user's own token.

Protect role assignment with a database rule that applies to INSERT and UPDATE, and remove ordinary-user writes to privileged columns. Reserve administrative role changes for a trusted server operation. Review for existing unexpected role assignments through an authorized owner workflow; this metadata audit did not export user identities or change accounts.

Evidence: [production-profile-security.json](production-profile-security.json), [production-policies.json](production-policies.json), [remaining policies](production-index-policy-checks.json), `lib/admin/requireAdmin.ts:21`.

### DB02 A public view bypasses proposal row security

**Priority P1. Confirmed live view definition, owner and grants. No proposal contents retrieved.**

`vendor_latest_quotes` is owned by `postgres`, has no `security_invoker` option, and is selectable by `anon`. It projects proposal amounts, currency and free-text messages without a caller filter. Owner-executed views can bypass the underlying table's RLS, so the protected `quotes` table does not secure this access path. The six public views all use this owner-executed default; each needs a review appropriate to its intended public fields. [Supabase RLS and views](https://supabase.com/docs/guides/database/postgres/row-level-security)

Remove public access to private proposal views and design a caller-secured replacement. Check consumers before changing view security. `profiles_resolved` projects IDs and roles, rather than all profile contact fields; do not describe it as a full-profile PII leak.

Evidence: [production-views.json](production-views.json), [production-database-metadata.json](production-database-metadata.json).

### DB03 Broad proposal policies bypass invitation and state checks

**Priority P1. Confirmed live policies and function definition.**

The permissive `quotes_vendor_crud` policy permits ALL operations based only on vendor ownership. It is OR-combined with narrower insertion/update policies, allowing their invitation or accepted-state requirements to be bypassed. The `can_vendor_view_rfq` security-definer function grants inquiry visibility based on the existence of a quote. Consequently, inserting an otherwise unauthorized quote for a known inquiry ID can also create an inquiry-read path. Public proposal IDs and inquiry IDs must not be treated as an authorization boundary.

Replace overlapping policies with a single consistent authorization model that validates invitation, expiry and thread state, and restrict mutable identity/state columns. Test direct API calls as well as server actions. Keep the function's intended inquiry-access rule aligned with those policies.

Evidence: [production-policies.json](production-policies.json), [production-security-metadata.json](production-security-metadata.json).

### DB04 Public vendor reads override publication controls

**Priority P1. Confirmed live policy.**

`vendors_read_all` allows SELECT with `true` for `public`, alongside narrower published-only policies. Permissive policies are combined with OR, so the broad policy defeats the publication restriction for direct base-table reads. Review internal columns and unpublished vendor content, then expose only the intended public projection. The public search view must also be checked against the same publication rules.

The live `vendor_public_search` and `vendor_profile_view` definitions themselves include an `is_published` filter. The confirmed gap is direct base-table access, rather than an absent filter in those two views.

Evidence: [production-policies.json](production-policies.json), [production-views.json](production-views.json).

### DB05 Notifications do not validate the recipient relationship

**Priority P2. Confirmed live insertion policy.**

Authenticated inserts require the actor to be the caller, but do not validate the chosen recipient or thread membership. An account can inject notifications aimed at another account if it supplies valid referenced IDs. Validate conversation membership, recipient and event type through the database or a trusted server operation.

Evidence: `notifications_recipient_insert` in [production-policies.json](production-policies.json).

### DB06 Proposal versions lack a uniqueness guarantee

**Priority P2. Confirmed live constraints and indexes.**

There is no unique index or constraint on the proposal's `(rfq_id, vendor_id, version)` combination. Concurrent revision creation can produce duplicate version numbers, while the latest-proposal view orders only by version. Add an atomic revision operation and an appropriate uniqueness guarantee after checking existing duplicates. Duplicate timestamp-touch triggers on `quotes` and overlapping policies also add maintenance complexity.

Evidence: [production-database-metadata.json](production-database-metadata.json), [production-security-metadata.json](production-security-metadata.json).

### DB07 A permissive review policy allows unrelated or impersonated reviews

**Priority P1. Confirmed live policy expression; no review inserted.**

`reviews_insert_owner_post_hire` checks that the caller owns an inquiry with an accepted quote, but does not bind the new review's author, vendor, or inquiry to that result. Its vendor expression is the tautology `q.vendor_id = q.vendor_id`. Because this policy is permissive, it bypasses the stricter hired-vendor policy for callers who satisfy the broad condition. Separate unrestricted author update/delete policies also defeat the seven-day editing policies.

Remove the broad alternatives and require the new row's author to match the caller and its vendor/inquiry to match the accepted booking relationship. Enforce the intended editing window and immutable linkage fields consistently.

Also test rating recomputation during that repair. Both the review trigger and rating-update helper execute as the caller, while vendor updates require vendor ownership or admin rights. This suggests a legitimate client review may leave stored vendor ratings stale; that implication was not tested with a production write.

Evidence: `reviews_insert_owner_post_hire`, `reviews_update_author`, and `reviews_delete_author` in [production-index-policy-checks.json](production-index-policy-checks.json).

### DB08 Review index gaps before growth

**Priority P2. Confirmed catalog gaps; no current capacity incident.**

Seven foreign keys lack a matching valid, nonpartial leading index: `profiles.language`, `quote_messages.sender_id`, `vendor_amenities.amenity_key`, `profile_translated_fields.language`, `vendor_categories.category_id`, `vendor_spaces.vendor_id`, and `notifications.actor_id`. Prioritize `vendor_spaces.vendor_id`: its table had 15,937 sequential scans and no index scans in the cumulative counters. These are historical counters, not scans per day. Small lookup columns do not automatically justify new indexes; evaluate actual query and delete/update workloads.

Evidence: [production-index-policy-checks.json](production-index-policy-checks.json), [production-database-metadata.json](production-database-metadata.json).

## Priority findings from code and public checks

### WM01 Patch the runtime framework and image libraries

**Priority P1 for the repository/redeployment path. Production's on-disk dependency versions are patched.**

The lockfile contains Next.js `16.3.0` and sharp `0.35.3`. npm reported 18 affected web dependency packages: one critical, fifteen high, and two moderate. These counts include dependency chains and do not represent eighteen independently exploitable production vulnerabilities. Four affected packages have production dependency paths: `next`, `sharp`, `qs`, and `source-map-js`.

Next's image optimizer and the application's direct sharp upload processing make image-decoding advisories relevant. The Next.js advisory identifies AVIF processing as an RCE risk and lists `16.3.3` as the fix for that specific issue. Later Next advisories in the collected report have newer patch thresholds, so fixing only that one advisory is insufficient. [Next.js AVIF advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4)

The sharp advisory affects versions below `0.35.5` and describes possible RCE under particular glibc Linux/runtime conditions. This project accepts `image/*`, including SVG, into sharp. The separate Windows-specific Next advisory is not evidence of an exploitable Linux deployment. [sharp advisory](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w)

SSH verified installed and locked Next `16.3.8`, sharp `0.35.5`, React `19.2.8`, and Supabase JS `2.106.1`. Production also pins `qs` to `6.16.0` and `source-map-js` to `1.2.2`. These changes are uncommitted, alongside media ownership fixes. Do not describe the audited production host as running the vulnerable local Next/sharp baseline. A clean checkout/redeployment can nevertheless reintroduce the old versions.

Reconcile the reviewed server patches into version control and repeat registry checks/tests on that intended release. Review npm's proposals rather than applying `npm audit fix --force`; the local report includes a proposed downgrade of the Next ESLint plugin to version 14.2.35.

Evidence: [web-dependencies.json](web-dependencies.json), [dependency-summary.json](dependency-summary.json), [production-dependency-drift.txt](production-dependency-drift.txt), [production-source-drift.txt](production-source-drift.txt), `package-lock.json`, `lib/media-processing.ts:55`.

### WM02 Restrict deletion of previous media to assets owned by the caller

**Priority P1 for repository reconciliation. The deployed R2 path already has ownership guards. No destructive reproduction performed.**

The R2 avatar endpoint reads the previous avatar from `user.user_metadata.avatar_image`, uploads a replacement, then deletes the previous URL's object key using server storage credentials. Authenticated users can edit their own Auth metadata independently of this upload route. The deletion path checks neither a server-owned asset record nor the caller's `clients/<user-id>/avatar/` prefix.

The local vendor deletion helpers also accept identifiers from vendor-editable JSON. Checking ownership of the profile does not establish ownership of the referenced object. An older Cloudinary avatar action passes a metadata-supplied `public_id` to `cloudinary.uploader.destroy`, but no current import/call site for that action was found. Treat that legacy action as unsafe dead code to remove or secure; its presence alone does not prove an active Cloudinary exploit path.

A malicious account could place another asset's identifier into its own metadata and trigger deletion through an otherwise legitimate replacement flow. Resolve deletion targets through trusted asset ownership records, require the caller's exact storage namespace and configured host, and reject identifiers outside that namespace. Do not verify this by deleting production objects.

An isolated check of the real URL parser confirmed that it resolves another vendor's object path and accepts a different R2 hostname. This check used dummy configuration and performed no network or storage operation.

Production differs: `lib/r2-ownership.ts` validates the exact configured HTTPS origin and caller's UUID namespace; the deployed deletion helper requires that prefix; affected call sites pass it. The compiled upload and vendor/signup artifacts contain the guard. Its new helper is untracked on the server. Preserve, test and commit this protection before redeploying. The local parser demonstration is evidence about the repository baseline, not evidence that the patched production deletion route is still exploitable.

Evidence: [storage-scope-check.json](storage-scope-check.json), [production-source-drift.txt](production-source-drift.txt), [production-build-guards.txt](production-build-guards.txt), `app/api/uploads/route.ts:99`, `lib/r2.ts:141`, `app/account/profile/actions.ts:149`, `app/vendor/profile/actions.ts:759`.

### WM03 Preserve email ownership verification during web signup

**Priority P1. Confirmed code behavior when the service credential works.**

Both client and vendor web signup call the Auth Admin API with `email_confirm: true` immediately after a public signup. This bypasses the configured confirmation requirement. The code can treat a supplied address as verified without the recipient proving ownership, enabling impersonation and undermining email-based trust. Mobile signup has a different confirmation flow.

The hosted **Confirm email** setting is enabled, but it cannot override an explicit administrator confirmation. The currently rejected server credential prevents this audit from claiming that automatic confirmation succeeds in production today. The bypass must be removed before restoring that credential.

Remove automatic confirmation from public signup and provision protected profile/vendor data after a verified session or a narrowly authorized server workflow. Test a newly registered unverified address on both web and mobile. Do not repair a broken server credential without also reviewing this behavior: a currently invalid credential could be masking this code path.

Evidence: `app/signup/actions.ts:128`, `app/signup/vendor/actions.ts:331`, `mobile/src/lib/auth.ts`, [email configuration](../email-delivery.md).

### WM04 Eliminate redundant notification polling while idle

**Priority P2. Confirmed source; mounted-session traffic estimate.**

The notification component performs two database requests per refresh: an exact unread count and a latest-three list. It subscribes to Realtime and also refreshes every fifteen seconds, on focus, and on visibility changes. The interval does not stop when the document is hidden and has no request coalescing or error backoff.

For one mounted instance running continuously, the interval alone schedules 480 database requests per hour, 3,840 over eight hours, or 11,520 over a day. Background browser throttling and session duration change actual totals. This is not a measured egress total. The component is absent from the homepage and requires a logged-in user; it is not an always-running server worker.

Use foreground-only refresh, a stable shared subscription, and a measured fallback interval when Realtime is unavailable. Coalesce simultaneous refresh triggers, stop requests while hidden, and back off on repeated failures. Keep the three-item projection and ownership filter.

Evidence: `components/NotificationLink.tsx:106`, `components/NotificationLink.tsx:142`, `components/NotificationLink.tsx:152`, `components/NavBarContainer.tsx:103`.

### WM05 Bound upload parsing and video processing

**Priority P2. Confirmed source resource controls missing.**

The upload route parses multipart form data before authenticating the caller. Image size checks exist, but video validation only checks that the file is nonempty and declares a video MIME type. The 50 MB limit is applied to compressed output, not the incoming file. Video uploads have no equivalent twenty-item gallery cap.

FFmpeg runs synchronously in the application request, with no enforced duration limit, process timeout, worker queue, concurrency cap, or bounded stderr buffer. The live Nginx configuration enforces a 55 MB body limit. That helps bound a request's input size, but does not bound concurrent uploads or decoder work.

Authenticate before multipart processing, enforce input and aggregate request limits, cap video count and duration, bound FFmpeg runtime and concurrency, and move expensive work to a constrained worker. Treat decoder format allowlists as part of the dependency fix.

Evidence: `app/api/uploads/route.ts:155`, `app/api/uploads/route.ts:299`, `lib/media-processing.ts:64`, `lib/media-processing.ts:203`, `lib/media-processing.ts:228`, `deploy/nginx-site.conf:18`.

### WM06 Paginate inboxes without downloading all conversation history

**Priority P2. Confirmed source; usage impact depends on account size.**

Inbox list loading retrieves all owned inquiries or invitations, all matching quote versions, and every matching message body to determine unread activity. There is no list pagination in these loaders. Growing accounts will transfer more data on every visit and can hit Supabase's response-row limit, causing incomplete results as well as excess work.

Page thread summaries using indexed activity/read markers. Fetch the latest proposal and message preview rather than full histories for the list; page older messages only inside the selected conversation. The public vendor profile API also fetches all reviews without pagination.

Evidence: `lib/inbox.ts:362`, `lib/inbox.ts:458`, `lib/inbox.ts:506`, `lib/inbox.ts:531`, `lib/inbox.ts:605`, `lib/quote-messages.ts:94`, `app/api/vendors/[slug]/route.ts:209`.

### WM07 Reduce public search payloads and avoid repeated exact counts

**Priority P2. Confirmed source and live response fields.**

Public search selects every field from `vendor_public_search`, including gallery arrays and long descriptions in two languages, then performs an exact count. The live one-result request returned 2,404 uncompressed bytes and included those fields. The route caps page size at fifty, which is a useful existing control, but sends more data than a listing card needs and has no explicit public caching policy.

Return a card-specific projection, move full galleries and descriptions to details, and use a bounded public cache where content freshness allows it. Reconsider whether each page needs an exact total. Validate indexes against actual queries before adding them. Suggestion/by-ID endpoints should also validate lengths, positive numeric limits, and maximum ID counts.

Evidence: `app/api/vendors/route.ts:39`, `app/api/vendors/suggest/route.ts:13`, `app/api/vendors/by-ids/route.ts:18`, [public-http.json](public-http.json).

### WM08 Align local and container runtimes with production's supported Node version

**Priority P2. Confirmed configuration drift; production already uses supported Node 22.**

`.nvmrc`, the Docker base image, and local execution use Node 20. Node's release page lists version 20 as end of life; versions 22 and 24 are LTS at the audit date. Production host and PM2 both report Node `22.23.3`. Align the development/container configuration with a supported tested runtime and update the deployment documentation. Do not treat this as an unpatched Node 20 production host. [Node.js release status](https://nodejs.org/en/about/previous-releases)

Evidence: `.nvmrc`, `Dockerfile:3`, local `node --version` returned `v20.19.5`.

### WM09 Add browser security headers at the application or proxy

**Priority P2. Confirmed public responses.**

The checked homepage response did not include CSP, frame restrictions, `X-Content-Type-Options`, HSTS, or Referrer-Policy. The repository Next and Nginx configurations do not define these headers. The response also exposes `X-Powered-By: Next.js`.

Define a tested content policy that accounts for Supabase, maps, video, and image providers; block unwanted framing and MIME sniffing; set a suitable referrer policy; and apply HSTS after confirming the domain's HTTPS configuration. Do not copy a policy that breaks the actual product integrations.

Evidence: [public-http.json](public-http.json), `next.config.ts`, `deploy/nginx-site.conf`.

### WM10 Make mobile vendor replacements atomic

**Priority P2. Confirmed source reliability issue.**

Mobile pricing, amenities, team, and availability saves delete existing rows before inserting replacements in separate API calls. Delete errors are not checked. If insertion fails after a successful deletion, the previous data is already gone; a concurrent editor can also lose changes.

Use a database transaction exposed through a narrowly scoped RPC or a versioned server operation. Validate the full replacement before changing records, enforce ownership in the transaction, and add a test that proves failed replacement preserves existing data.

Evidence: `mobile/src/lib/vendorProfile.ts:234`, `mobile/src/lib/vendorProfile.ts:253`, `mobile/src/lib/vendorProfile.ts:272`, `mobile/src/lib/vendorProfile.ts:292`.

### WM11 Establish a versioned database migration baseline

**Priority P2. Confirmed repository drift and no recorded hosted migrations on the project overview.**

The checked-in schema snapshot contains nineteen objects and predates several runtime tables/columns. Setup is spread across manual SQL and apply scripts. The application frequently retries missing-column and policy errors, while some paths silently ignore missing tables. There is no complete `supabase/migrations` chain covering the current source.

Create a reviewed baseline from the intended production schema, then version later changes. Add an empty-database setup test and authorization tests. Do not replace live policies using the old local dump; it contains the database risks listed below.

Evidence: `schema/supabase-schema.json`, `sql/`, `migrations/`, `scripts/apply-inbox-threads.js`, `lib/inbox.ts`, `lib/quote-messages.ts`.

### WM12 Separate readiness from process liveness

**Priority P2. Confirmed source and public behavior.**

`/api/health` always returns `ok`. Deployment treats that as a successful health check, so broken database credentials can pass deployment verification. Public managed content also returns locale defaults after database failures, which can make a configuration failure look healthy.

Retain a lightweight liveness check, but add a private readiness check that validates a zero-row database operation and required service configuration without exposing values. Alert on fallback/error rates rather than silently depending on the fallback.

The owner-run credential status check independently returned `401` against the correct hosted project's REST API, while `/api/health` returned `200`. Public vendor search working does not prove privileged operations work, because search uses the public key. See WM17 for the credential failure.

Evidence: `app/api/health/route.ts:5`, `deploy/deploy-if-changed.sh:47`, `lib/content/siteContentServer.ts:27`, [production-owner-security.txt](production-owner-security.txt), [public-http.json](public-http.json).

### WM13 Verify rotation of the historical hosted service credential

**Priority P2. Confirmed credential in Git history; current validity untested.**

An old `.env.local` blob in commit `5f6e3815cc1f` contains a hosted Supabase service-role JWT. That token refers to a different historical project than the current Wedding Market project. Removing the file later did not remove it from Git history. No token value is included in this report or evidence.

Verify that the historical project/key was retired or rotated and review repository access. The current tracked-file scan did not identify a current hosted secret with its limited patterns. Its eleven database-URL matches were local development defaults or documentation placeholders, not eleven confirmed leaked production passwords. A pattern scan is not proof that no secret exists.

Evidence: [repository-scan.json](repository-scan.json), removal commit `9a727b0b`.

### WM14 Repair the unused Docker packaging path before relying on it

**Priority P3. Confirmed build configuration mismatch.**

The Dockerfile copies `.next/standalone`, but `next.config.ts` does not enable standalone output and the successful local production build did not create that directory. The container packaging path would fail at that copy step. The known PM2 deployment does not depend on this Dockerfile.

Enable and verify the intended output mode if Docker remains supported, or clearly retire that deployment path. Keep one accurate production deployment procedure; the current server script/environment layout also differs from the generic README.

Evidence: `Dockerfile:41`, `next.config.ts`, [deployment context](../project-context.md).

### WM15 Update the mobile build dependency override without downgrading Expo

**Priority P2. Confirmed lockfile findings; installed-app exploitation not established.**

The authorized mobile registry check reported 56 affected dependency packages: one critical, fifty-three high, and two moderate. Many entries are inherited through Expo CLI, Metro, React Native's tooling, and Jest. A non-development flag in npm's dependency graph does not establish that the vulnerable code ships in the APK.

The mobile package explicitly overrides `shell-quote` to `1.10.0`, which is affected by the newly published command-quoting advisory. The maintainer lists `1.11.0` as patched. npm classified the package as critical; the maintainer's advisory labels it high and specifies a particular combination of untrusted inputs and shell execution. No application path meeting those conditions was established. [shell-quote advisory](https://github.com/ljharb/shell-quote/security/advisories/GHSA-pqg4-j6r4-53mv)

Review that override and compatible patches in the Expo/Jest dependency chains. Do not apply the suggested downgrade to Expo 44 or React Native 0.72.17: those are not a compatible remediation for this SDK 56 app. Rebuild and repeat the tests after deliberate dependency changes.

Evidence: `mobile/package.json:56`, [mobile-dependencies.json](mobile-dependencies.json), [mobile-dependency-summary.json](mobile-dependency-summary.json).

### WM16 Establish recoverable database and media backups

**Priority P1. Confirmed recovery-control gaps across database and host.**

The scheduled-backup page explicitly states that this Free-plan project has no project backups. On the exact Hetzner server at `89.167.111.168` (console name **OpenClaw**, OS hostname **dw-production**), automatic backups are disabled and the snapshots page states there are no snapshots. The console also offers **Enable protection**, indicating server deletion protection is off. R2 has no bucket lock rules; its only lifecycle rule aborts incomplete uploads after seven days, which does not preserve deleted objects. No independent offsite recovery copy or restore rehearsal was established. These observations do not rule out an owner-managed backup elsewhere.

Define recovery-point and recovery-time targets, arrange encrypted offsite database backups with retention and monitored success, and rehearse restoration into an isolated environment. Include Auth data, schema/policies, required configuration references and R2 media in the recovery design. Review deletion protection and host backups. Enabling a paid plan is a user billing decision; no plan change was made. Hetzner snapshots of the web server alone cannot restore hosted Supabase data. Do not assume ordinary S3 versioning is available on R2: its standard Get/PutBucketVersioning APIs are listed as unsupported. Design a separate recoverable media copy, and do not apply blanket object locks that break legitimate replacement/deletion flows. [R2 S3 compatibility](https://developers.cloudflare.com/r2/api/s3/api/)

Evidence: [production-backups.txt](production-backups.txt), [production-hetzner-backups.txt](production-hetzner-backups.txt), [production-hetzner-snapshots.txt](production-hetzner-snapshots.txt), [production-hetzner-overview.txt](production-hetzner-overview.txt), [production-r2-settings.txt](production-r2-settings.txt).

### WM17 The configured server database credential is rejected

**Priority P1. Confirmed live status check without customer rows or secret output.**

The server owner used the configured privileged Supabase credential for a HEAD request selecting zero profile rows in the correct Wedding Market project. The result was HTTP `401`. The credential value was never printed. This establishes failed authentication for that configured credential, not the precise reason it fails. Do not infer whether it expired, was revoked, or belongs to another project without a separate configuration review.

Server-admin writes, managed content, notification helpers, or other privileged paths can fail despite the process and public-key queries being healthy. Fix DB01 and remove the public-signup confirmation bypass before restoring privileged access. Then configure a valid server-only credential through the owner's normal secret-management flow and verify representative operations without disclosing the credential. Add readiness/alerting as described in WM12.

Evidence: [production-owner-security.txt](production-owner-security.txt), `lib/supabase/admin.ts`.

### WM18 Preserve production security fixes in a reproducible release

**Priority P1. Confirmed source and lockfile drift.**

The server checkout and local repository share HEAD `07f4f489`, but the server has six modified tracked files and an untracked R2 ownership helper. Those changes include patched Next/sharp dependencies, transitive overrides and R2 deletion guards. Therefore the commit ID alone does not describe the running release, and the passing local checks do not validate the exact server patch.

Capture and review the existing patch, normalize its file formatting, bring it into version control with appropriate ownership/regression tests, and build an identifiable release. Do not reset or clean the server checkout before preserving this work. Retain the protected `.env.production.local` layout and keep the separate DW service isolated.

Evidence: [production-dependency-drift.txt](production-dependency-drift.txt), [production-source-drift.txt](production-source-drift.txt), [production-build-guards.txt](production-build-guards.txt).

### WM19 Review Auth abuse and administrator session controls

**Priority P2. Confirmed settings; no abuse simulation performed.**

Hosted email confirmation is on, anonymous sign-in and manual identity linking are off, and secure email change is on. CAPTCHA and leaked-password protection are off; the dashboard identifies leaked-password protection as available on Pro and above. Secure password change and requiring the current password for updates are also off. Review these against the intended recovery/session experience before changing them.

Configured sign-up/sign-in and token-verification limits are each 30 requests per five minutes per IP; refresh is 150 per five minutes; the minimum per-user email interval is 60 seconds. The email-send limit and minimum-password value were redacted by browser tooling and were not independently established. The application admin guard checks the profile role without an additional MFA assurance check. Require suitable administrator protection after repairing the role-assignment gap. Current redirect URLs are narrowly scoped to the two web hosts and the native callback, with no broad wildcard visible.

Evidence: [production-auth-protection.txt](production-auth-protection.txt), [production-email-provider.txt](production-email-provider.txt), [production-signup-settings.txt](production-signup-settings.txt), [production-auth-rate-limits.txt](production-auth-rate-limits.txt), [production-auth-urls.txt](production-auth-urls.txt), `lib/admin/requireAdmin.ts`.

### WM20 Move public media off the development endpoint

**Priority P2. Confirmed R2 settings.**

The `the-wedding-market` bucket has public development access enabled and no custom domain. Cloudflare labels this `r2.dev` URL as rate-limited and unsuitable for production; caching, access-control and WAF features require a custom domain. Public image delivery is intentional, so this setting alone is not evidence that private customer files were exposed. Keep genuinely private uploads behind a separate authorized access path. [Cloudflare public bucket guidance](https://developers.cloudflare.com/r2/buckets/public-buckets/)

Plan a controlled custom media-domain migration with caching and URL compatibility for existing records. Do not simply disable `r2.dev` while stored asset URLs still depend on it. The bucket is small: 31 objects totaling about 7.35 MB, Standard class. The default seven-day multipart abort rule is enabled. No CORS policy is defined; server-side uploads and ordinary image display do not, by themselves, require adding one. Data access logs are disabled; evaluate their need and cost rather than enabling them blindly.

Evidence: [production-r2-summary.json](production-r2-summary.json), [production-r2-settings.txt](production-r2-settings.txt).

### WM21 Direct-origin access bypasses Cloudflare

**Priority P2. Confirmed one-request HTTPS check, with normal certificate validation.**

A direct HEAD request to `89.167.111.168` with the correct Wedding Market host returned HTTP 200 from Nginx, without traversing Cloudflare. UFW allows web traffic from anywhere, and no Hetzner cloud firewall is applied. The host firewall is active, so absence of a cloud firewall is not absence of a firewall. However, any Cloudflare edge controls can be bypassed through this reachable origin.

The Wedding Market security-rules page shows zero custom rules, zero rate-limiting rules, and no created managed-rule deployments. This does not mean Cloudflare's built-in network/DDoS protections are absent. Add targeted abuse controls where justified, especially for expensive processing endpoints; keep application authorization and resource limits as the primary controls.

If edge filtering is part of the security design, enforce suitable origin authentication and/or correctly maintained Cloudflare address restrictions. Plan around the separate DW site, SSH recovery access, and Let's Encrypt renewal; do not apply a blanket firewall change to this shared server. [Cloudflare origin protection](https://developers.cloudflare.com/ssl/origin-configuration/authenticated-origin-pull/)

Evidence: [production-origin-access.json](production-origin-access.json), [production-owner-security.txt](production-owner-security.txt), [production-hetzner-firewalls.txt](production-hetzner-firewalls.txt), [production-cloudflare-rules.txt](production-cloudflare-rules.txt).

### WM22 Scope storage credentials to the intended bucket

**Priority P2. Confirmed account-token scope; deployed-key mapping not established.**

The R2 token listing contains one active account token with **Object Read & Write** access to **All buckets**. There is currently one visible bucket, so this does not establish present access to an unrelated bucket. It would also cover future buckets, including a recovery bucket created in this account. The audit did not reveal token values or prove that this particular token is the key configured on the application server.

Map the deployed key to its intended token through an owner-only metadata check and scope application access to the Wedding Market bucket. Keep backup credentials separately restricted. No token was created, edited, revealed or revoked during the audit.

Evidence: [production-r2-token-scopes.txt](production-r2-token-scopes.txt).

### WM23 Tighten edge and origin TLS policy

**Priority P2. Confirmed Cloudflare TLS mode.**

The zone uses **Full** encryption, rather than **Full (strict)**. Full encrypts the origin connection without the stricter certificate validity/hostname checks. The origin currently presents a valid Let's Encrypt certificate, and the direct-origin check passed normal TLS verification, so stricter validation should be evaluated for every served hostname. Confirm apex and www coverage and renewal before changing the setting. This is separate from authenticating that callers came through Cloudflare. [Cloudflare Full (strict) requirements](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/)

The edge minimum is still **TLS 1.0**. Raise the minimum to a tested modern baseline, normally TLS 1.2 for these clients; TLS 1.3 is already enabled. Cloudflare's **Always Use HTTPS** toggle is off, but the independent HTTP HEAD check returned a 301 redirect to HTTPS, so this audit did not find an HTTP homepage served in cleartext. HSTS was absent from the checked public response. Keep existing redirects working and test every relevant hostname before tightening transport policy.

Evidence: [production-cloudflare-tls.txt](production-cloudflare-tls.txt), [production-cloudflare-edge-tls.txt](production-cloudflare-edge-tls.txt), [production-owner-security.txt](production-owner-security.txt), [production-origin-access.json](production-origin-access.json), [production-http-redirect.json](production-http-redirect.json).

## Production resource and operational assessment

These measurements belong to Wedding Market. Digital Wedding's log-query or worker figures were not assigned to this project. The organization contains one project and the current cycle is October 8–November 8, 2026. Dashboard figures can lag; they are not precise real-time counters.

| Resource | Measured state on October 19 | Assessment |
| --- | --- | --- |
| Supabase plan and egress | Free; 0.041 of 5 GB uncached egress; cached egress 0 | No current quota pressure; optimize polling and projections before traffic grows |
| Dashboard database size | 0.034 of 0.5 GB; detailed card 32.68 MB | Comfortable headroom; dashboard sizing differs from the direct `postgres` database measurement below |
| Direct database size | PostgreSQL 17.6; `pg_database_size(current_database())` 19,025,043 bytes, about 18.14 MiB | Small current database; do not silently equate this scope/time with the billing size |
| Database compute | Overview CPU 2%, RAM 53%, disk 14%, connections 8/60; later catalog sample 9 backends | Nano compute is not currently saturated; a snapshot does not establish peak behavior |
| Maintenance counters | 0 deadlocks since statistics reset May 7; approximately 4 dead tuples across the sampled public tables | No evidence of an urgent vacuum/bloat incident; null autovacuum timestamps alone are not failures on small tables |
| Query costs | Top cumulative query groups collected without query text; 15,948-call group averaged about 4.14 ms | Cumulative counters are not daily traffic or endpoint attribution; no need for speculative indexes or a larger instance |
| Supabase Storage/Realtime/Functions | Storage objects/buckets estimated 0; no storage RLS policies; cycle usage shows 0 storage, Realtime and edge-function activity | Application media uses external R2; empty Supabase Storage does not describe R2 consumption |
| Supabase logs | 0.041/1 GB ingestion; 0/100 GB log-query usage shown | This audit used catalog queries, not broad log scans. Dashboard marks these log allowances as upcoming |
| Cloudflare website traffic | October 18–19: 1.63k requests, 142 unique visitors, 22 MB served, 15.22% cached | These include bots and anonymous requests; they are not authenticated users or Supabase egress. No Workers connected on this zone |
| Host | Ubuntu 24.04.5 LTS; Node 22.23.3; load 0.00/0.02/0.00 in SSH sample | Supported runtime and low load |
| Host maintenance/startup | PM2 deploy service enabled and active; no reboot-required marker; cached package lists show one pending `snapd` update from `noble-updates`; fail2ban reports inactive | Package lists were not refreshed and no OS packages changed; this is not a complete installed-package CVE assessment. SSH password login is already off |
| Host memory | 7,751 MiB RAM; 1,218 MiB used; 6,532 MiB available; 2,047 MiB swap with 0 used | No current memory pressure |
| Host disk | 75 GB filesystem, 11 GB used, 62 GB available; 15% blocks and 5% inodes used | No current disk/inode pressure; `.next` 338 MB, dependencies 1.1 GB |
| Wedding Market process | Online, PID 1022; Node 22.23.3; about 378 MiB RSS; PM2 reports 0 restarts since current start | Useful point-in-time health; not proof that historical incidents never occurred |
| Network and SSH | App ports 3000/3001 bind loopback; UFW default-deny inbound allows only SSH and web ports on IPv4/IPv6; SSH passwords off; max tries 3; no cloud firewall applied | Existing host controls are useful. Key-based root access remains permitted; direct-origin HTTPS returns 200 and bypasses Cloudflare |
| Origin TLS | Let's Encrypt certificate valid September 26–December 25, 2026; certbot timer present | Certificate currently valid; a timer does not prove a future renewal will succeed |
| Logs | Nginx rotates daily, 14 generations with compression; Wedding Market PM2 logs about 65 KB total | No present log-size pressure; a PM2 rotation policy was not independently established |
| Secret-file permissions | `.env.production.local` is mode 600, owned by deploy | Properly protected from the audit account; credential validity is a separate issue |
| R2 | 31 objects, 7.35 MB Standard; $0.00 account billable usage shown for September 25–October 25; 102 account Class B operations | No storage/cost pressure; use production delivery and a separate recovery design |
| Hosting plan | Shared CX33, 4 vCPU, 8 GB RAM, 80 GB disk; console displays 7.99/month base price and 5.76 usage | Shared with DW; this is not a Wedding Market-only cost or a final invoice including all extras |
| Backups | No scheduled Supabase project backups; Hetzner automatic backups disabled and no snapshots; no R2 locks | Confirmed recovery-control gaps; no independent owner-managed backup was established |

The confirmed recurring application work is browser notification polling. Its two requests every fifteen seconds imply 480 requests per mounted session-hour, before focus/visibility events. The mobile intervals reviewed are UI animation timers, not evidence of idle database polling. GB/day savings cannot be inferred from request counts without actual payloads and active session hours.

Media uploads need input/concurrency/time limits even on a lightly loaded host, particularly because DW shares its resources. Inbox/search query changes should reduce future transfer and avoid response-row truncation. Bucket totals, lifecycle settings, public access, token permission metadata and hosting backup controls were inspected. No object-by-object orphan reconciliation, private object download or bucket cleanup was attempted.

Evidence: [production-usage.txt](production-usage.txt), [production-database-metadata.json](production-database-metadata.json), [production-query-counters.json](production-query-counters.json), [production-server.txt](production-server.txt), [production-owner-security.txt](production-owner-security.txt), [production-r2-summary.json](production-r2-summary.json), [production-hetzner-overview.txt](production-hetzner-overview.txt), [production-cloudflare-overview.txt](production-cloudflare-overview.txt), [public-http.json](public-http.json).

## Validation results

| Check | Result | Evidence |
| --- | --- | --- |
| Web TypeScript | Pass | [web-typecheck.txt](web-typecheck.txt) |
| Web ESLint | Pass | [web-lint.txt](web-lint.txt) |
| Web tests | 20 passed | [web-tests.txt](web-tests.txt) |
| Web production build | Pass | [web-build.txt](web-build.txt) |
| Mobile TypeScript and ESLint | Pass | Initial stages in [mobile-checks.txt](mobile-checks.txt) |
| Mobile tests | 28 passed in 7 suites | [mobile-tests.txt](mobile-tests.txt) |
| Expo dependency compatibility | Pass | [mobile-expo-check.txt](mobile-expo-check.txt) |
| Android production bundle export | Pass, approximately 2.8 MB Hermes bundle | [mobile-android-export.txt](mobile-android-export.txt) |
| Anonymous admin API access | Site settings/blog returned 401; admin page redirected to login | [public-http.json](public-http.json) |
| Admin advertising GET | 405; that method is not implemented | Do not interpret this as a successful authorization test of its write method |
| Local PostgreSQL metadata | Connection refused; local stack not running | [local-database.json](local-database.json) |

The initial sandbox runs could not download Google Fonts or write Jest/Hermes temporary files. The build/export were rerun with the needed execution access; tests used a workspace cache. The final results above distinguish these environment restrictions from application failures. Existing unit tests do not establish that database authorization is secure.

## Recommended remediation order

1. **Immediately:** restrict anonymous writes on the six unprotected tables and prevent self-assignment of privileged profile roles. Preserve an authorized administrator path and verify cross-account isolation in a test environment.
2. **Before restoring server privileges or inviting users:** secure proposal views, reconcile quote/review policies, remove the signup auto-confirmation bypass, and establish a tested database/media recovery path.
3. **Before redeployment:** preserve and version the existing server security patch, reconcile supported dependencies/runtime, repair the rejected server credential through the owner's secret-management process, and add private readiness checks.
4. **Then:** reduce notification/inbox/search work; constrain media processing; make mobile replacement saves atomic; add migration coverage, targeted indexes and browser security headers.
5. **Verify:** two clients and two vendors cannot access/change one another's data through direct APIs; unverified email cannot become confirmed through signup; failed replacement leaves previous data intact; known-good backups restore into an isolated environment.

## Limits and access handoff

The database findings are established from live catalogs and settings, without mutating customer data or retrieving proposal bodies. No exploit account, load test, paid-plan change, production fix, credential rotation, or service restart was performed. No successful backup restore or certificate-renewal rehearsal was performed. The released APK and physical-device flows were not tested. Offsite backups outside the inspected services, all detector/managed-rule internals, a complete OS-package CVE assessment, and the mapping of the deployed R2 key to the displayed token were not independently established. The audit establishes security configuration failures; it does not establish that attackers exploited them.

The owner script is retained at [owner-security-checks.sh](owner-security-checks.sh), with output at [production-owner-security.txt](production-owner-security.txt). The temporary SSH account `wm-audit-20261019` has no sudo permission and its authorized key restricts forwarding/PTY features. The private key is outside the repository and is not included in audit artifacts. Revoke the temporary account/key after follow-up inspection is finished.

The initial Digital Wedding dashboard mismatch was resolved by the user signing into the correct account. The organization switcher was not opened after automatic approval review blocked it. The user explicitly approved both registry checks and ran the owner-only server diagnostics. The optional Supabase plugin was not required for the completed browser inspection.

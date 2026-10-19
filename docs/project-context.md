# Wedding Market project context

Recovered on October 19, 2026, from the previous project chats, repository documentation, and source code. The latest recovered implementation work is from August 18, 2026, on branch `dev` at commit `07f4f489c108fc850d6f7c22292d3a328c3fe747`.

The Wedding Market connects couples planning weddings in Costa Rica with wedding vendors. The project includes a Next.js website and an Expo React Native app for Android and iOS, using the same Supabase authentication, database, and Next.js APIs. The most recent work fixed quote conversations, improved mobile language selection, and simplified quote forms. An Android preview build had been submitted when the last chat ended.

## Current verified deployment state

As of the latest October 19, 2026 verification, live is `3254c5b2f336299e8f5543301b385cb695de2f1b`. The code, profile editing UX, responsive website header, warmer wedding styling and richer public vendor profiles are deployed. The owner requested deployment by default and installed a restricted gateway; the assistant has successfully performed deployments through it. Use that gateway for routine releases and verify the exact commit plus public checks. See [direct deployment instructions and proof](header-2026-10-19/direct-deployment-setup.md) and [the latest profile release](vendor-profile-2026-10-19/implementation-review.md). Historical live/source references below describe earlier states; the latest handoff at the end supersedes them.

## Where the last session stopped

On August 18, the user confirmed an EAS build listing containing:

- Preview build `5b0e085b-375a-4985-9e1f-3b939cc35ba8`, using commit `ce7fe8cd`, with status `in queue` at that time.
- An older finished preview build, `6c952d0f-cc92-4de1-aaa7-edef251e37c8`, using commit `e66d3c75`.
- The server checkout updated to `07f4f489` on `dev`.

The latest preview includes the simplified quote forms. The following commit only removed an obsolete Claude worktree, so it did not require a replacement APK. The last instruction was to inspect the submitted build rather than start another one. Its completion, installation, and subsequent device testing are not established by the recovered chat.

[Latest submitted preview build](https://expo.dev/accounts/lportillo1313/projects/the-wedding-market/builds/5b0e085b-375a-4985-9e1f-3b939cc35ba8)

This is historical build information, not a current EAS status check.

## Product decisions from the user

### Destination and account setup

- Wedding destinations are in Costa Rica. Quote forms do not need country or state selectors; the backend stores `Costa Rica` automatically.
- The country requested during signup means the country the client is contacting from, not the wedding destination.
- Signup copy and fields should be centered. Use the clearer `Get started` action.
- Signup guest count and wedding budget are optional and appear in the final planning step. The budget input has a fixed `$` prefix.
- Guest count being optional during signup does not make it optional when submitting a quote request.

### Quote requests and conversations

- Required fields must be visibly marked with `*`; optional fields must be labeled. Errors should identify the missing or invalid field.
- Use one optional budget input, rather than minimum and maximum budget inputs. The existing database fields remain compatible by storing the same amount in both budget columns.
- Use a calendar to select the date, not a free-text date field.
- Prefill available date, guests, budget, theme, and phone from the client profile.
- Both client and vendor inboxes should show the complete inquiry, including date and flexibility, guests, location, budget, theme, language, and the original message.
- Maintain consistent quote and messaging behavior on web and mobile.

### Language and mobile menus

- The mobile app should use the phone language on first launch, choosing Spanish for a Spanish locale and English otherwise. Later language choices persist; account language preferences also participate in the app's language behavior.
- Use separate `English` and `Español` menu choices with a checkmark for the selected language. The menu stays open after a language change.
- Privacy Policy and Terms were removed from the mobile dropdown menu; they remain available through profile account controls.
- The web supports English and Spanish, with Spanish as the configured fallback in `lib/i18n/index.ts`.

### Design and vendor content

- The requested typography is Playfair Display for titles, sometimes mixing italic and regular, and Google Sans for body copy.
- The homepage uses a video hero and vendor logo carousel. Later work refined the premium editorial sections, magazine promotion, scroll reveals, mobile layout, and footer transition.
- Vendor fields and pricing must match their service category. A photographer should not inherit venue capacity or catering pricing fields.
- Capacity applies to capacity-based services such as venues, catering, bar, rentals, transportation, and accommodations.
- Public sponsored and advertising sections were intentionally hidden for later activation. The current switch is `VENDOR_ADS_PUBLICLY_VISIBLE = false` in `lib/content/vendorAds.ts`; preserve that decision unless the user changes it.
- Authentication emails should use a clean light-gray header, dark typography, gold accents, and a softer charcoal call to action. The user explicitly preferred this to a black header.

## Features present in the repository

| Area | Existing implementation |
| --- | --- |
| Public website | Homepage, vendor search and profiles, shortlist, blog, about page, legal pages, and PWA registration |
| Client account | Profile and planning data, unified inbox, proposal acceptance, replies, notifications, and reviews |
| Vendor workspace | Profile, category and location editing, media, pricing, availability, amenities, team, reviews, publishing, and lead inbox |
| Administration | `/private-control-room-hub`, including operations, site content, blog posts, and advertising management |
| Authentication | Signup, confirmation, login/logout, password recovery, role guards, browser sessions, and native callbacks |
| Mobile app | Client, vendor, and admin surfaces; search and profiles; shortlist; inquiries and proposals; replies; uploads; push notifications; account controls; English and Spanish |
| Email | Supabase Auth over Resend SMTP; application notifications over the Resend API; newsletter opt-in through Resend Contacts and Topics |
| Media | Cloudflare R2 uploads through the backend, image and video processing, and shared media URL handling |

The mobile app reuses the existing backend. A second mobile server is not part of the documented architecture. Its map experience includes a location preview and opens Google Maps for navigation.

## Inquiry and proposal architecture

The unified inbox is already implemented. The older [inquiry and proposal plan](unified-inquiry-proposal-flow.md) is a design reference, not a list of entirely unfinished work.

- `rfqs` holds the shared inquiry or event brief.
- `rfq_invites` links an inquiry to each vendor and carries thread state, read markers, and related metadata.
- `quotes` holds proposal versions. The web vendor action inserts a new version rather than overwriting the previous proposal.
- `quote_messages` holds messages associated with proposals. The inbox combines messages across proposal versions.
- Thread keys are constructed as `rfq_id__vendor_id`.
- Client routes are `/account/inbox` and `/account/inbox/[threadKey]`.
- Vendor routes are `/vendor/inbox` and `/vendor/inbox/[threadKey]`.
- The old client and vendor RFQ and quote list routes redirect to the corresponding inboxes.
- Current request creation supports up to ten vendors and uses a fourteen-day invitation expiry.

The plan's richer structured proposal fields and a later migration to messages linked directly to threads should not be assumed complete. The implementation also uses role-specific display statuses that differ from the plan's proposed single status vocabulary.

Database compatibility matters: code supports both `owner_id` and older `owner_uuid` ownership columns, missing optional thread columns, and selected policy-related fallbacks. Preserve ownership checks when changing these paths.

## Technology and important files

The web package specifies Next.js 16, React 19, TypeScript, Bootstrap with Sass customization, and Supabase. `.nvmrc` now specifies Node 22; Node 24 also passes validation. The mobile package uses Expo SDK 56 and React Native 0.85 with separate dependencies and a separate lockfile under `mobile`.

| Location | Purpose |
| --- | --- |
| `app/`, `components/`, `styles/` | Web routes, UI, and styling |
| `contexts/LanguageContext.tsx`, `lib/i18n/`, `locales/` | Web language selection and translations |
| `lib/inbox.ts`, `lib/quote-messages.ts`, `lib/rfqs.ts` | Shared inquiry and messaging behavior |
| `app/api/rfqs/create/`, `app/api/mobile/` | Request creation and authenticated mobile workflow endpoints |
| `lib/supabase/` | Browser, server, admin, and bearer-authenticated database clients |
| `lib/notifications.ts`, `lib/notification-email.ts`, `lib/resend.ts` | Notifications and email delivery |
| `lib/r2.ts`, `lib/media-processing.ts`, `app/api/uploads/` | Storage and media upload processing |
| `lib/vendorServiceProfile.ts` | Category-specific vendor behavior |
| `lib/content/`, `components/admin/` | Managed homepage content and advertising |
| `mobile/App.tsx`, `mobile/src/lib/` | Native screens and supporting services; most screens remain in the large `App.tsx` file |
| `mobile/app.json`, `mobile/eas.json` | Native configuration and development, preview, and production build profiles |
| `schema/`, `sql/`, `migrations/`, `supabase/` | Schema snapshots, manual SQL changes, local backend configuration, and auth templates |

An optional server-side AI translation helper exists in `lib/ai/translate.ts`. Credentials are supplied through environment variables. A Stripe dependency alone does not establish a working payment flow; current terms describe bookings and payments as handled between couples and vendors.

## Hosting and deployment context

The recovered public domain is `thewedmarket.com`. In the July 28 deployment chat, the user confirmed both sites were working:

- Wedding Market: `/var/www/wedding-market`, PM2 process `wedding-market`, loopback port `3001`.
- The separate DW application: `/var/www/dw`, port `3000`.
- Both run under the Linux `deploy` user's PM2 environment.

The August 17 chat established an important server-specific difference from the generic [deployment README](../deploy/README.md): the existing server uses `/home/deploy/deploy-wm.sh` and `.env.production.local`. The repository deployer expected `.env.production` and failed against that layout. Preserve the existing environment arrangement and inspect the actual server script before changing deployment commands.

The July chat also ended with DNS-only records and a Let's Encrypt certificate, whereas the repository README describes a Cloudflare-proxied Origin CA arrangement. Treat DNS, TLS, timer installation, and the currently deployed commit as live state to inspect when deployment work resumes.

Previous EAS failures came from running npm in `/root` or `/home/deploy`, mixing root and deploy ownership, and an accidental nested `mobile/.git` repository. Use the correct project directory and Linux user. `mobile` belongs to the parent Git repository. An existing EAS login is specific to its machine and operating-system user.

Do not use the web package's `npm start` as a substitute for the configured production PM2 command: its `prestart` hook starts local Supabase.

## Mobile release configuration

- Android package and iOS bundle identifier: `com.theweddingmarket.app`.
- Native callback: `theweddingmarket://auth/callback`.
- Expo project: `the-wedding-market` under account `lportillo1313`.
- Development builds use a native development client. Preview builds produce an internally distributed APK. Android production builds produce an App Bundle.
- EAS environments provide `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_WEB_URL`, and `EXPO_PUBLIC_WEB_API_URL`.
- The web API URL points to the Wedding Market website, not the Supabase project URL. The August fix added validation and a recovery path for that misconfiguration.
- The service-role key and Resend credentials stay on the server.

The Android and iOS release checklists are in [Google Play launch checklist](google-play-launch-checklist.md) and [App Store launch checklist](app-store-launch-checklist.md). The recovered chats do not confirm public store publication, completion of iOS signing, or final physical-device release testing.

## Recent implementation history

| Date | Commit | Result |
| --- | --- | --- |
| August 18, 2026 | `07f4f489` | Removed the obsolete tender-yonath Claude worktree reference |
| August 18, 2026 | `ce7fe8cd` | Simplified quote forms, fixed Costa Rica as the destination, added calendar selection and profile prefilling |
| August 18, 2026 | `e66d3c75` | Fixed mobile quote authentication, full inquiry details, web API configuration safeguards, and device-language defaults |
| August 17, 2026 | `8fad5619` | Branded auth templates and browser-safe password recovery |
| August 17, 2026 | `3f227910` | Aligned Expo dependencies for Android builds |
| August 17, 2026 | `f939ef0a` | Improved signup and mobile account menu |
| August 13, 2026 | `34bca5be` | Added web and mobile password recovery |
| August 12, 2026 | `afb0f637` | Added Resend email delivery |
| August 12, 2026 | `eba29d5e` | Expanded mobile features and quote workflows, backend integration, and launch preparation |

The August 18 chat reported passing mobile typecheck, lint, 28 tests, and Expo compatibility checks, plus web typecheck, lint, 20 tests, and a production build. Those are historical results. No application checks or live deployments were performed as part of this context recovery.

## Work that still needs confirmation

1. Whether preview build `5b0e085b-375a-4985-9e1f-3b939cc35ba8` finished and was installed, and whether the latest quote flow was tested on a real device.
2. Which commit the live web process currently runs. Pulling a server checkout does not prove that the running application was rebuilt and restarted.
3. Whether the final browser-safe recovery change was deployed and its hosted Supabase template updated. Six light-themed auth templates were reported published earlier on August 17, but the later recovery fix ended with deployment instructions and a request for verification output.
4. Whether production-only mobile dependency changes remain in the server working tree or a stash. The August 17 chat instructed preserving them before deployment.
5. Store submission, signing, push credentials, and the release checks identified in the launch documents.

The generic deployment instructions and historical npm audit results must be reassessed against the actual environment when those tasks resume.

At recovery start, the local working tree already showed a deleted `.claude/worktrees/adoring-hoover` entry. It was left untouched. The source branch was `dev`, tracking the locally recorded `origin/dev`; no remote fetch was performed for this recovery.

## Commands for future development

### Live audit update, October 19, 2026

The [security, database and resource audit](audit-2026-10-19/audit-report.md) supersedes the historical deployment assumptions above where they differ. Production inspection confirmed:

- Supabase project **WedMarket**, ref `aousexbvujjnvbudpsmz`, organization **CR Wedding Destination**, is separate from Digital Wedding.
- The host is `89.167.111.168`, with Wedding Market in `/var/www/wedding-market`, PM2 name `wedding-market`, and loopback port 3001. Node is `22.23.3`; the audited local `.nvmrc`/Docker configuration used Node 20; both now specify Node 22.
- The server HEAD is still `07f4f489`, but it has uncommitted dependency and R2 ownership fixes, including an untracked `lib/r2-ownership.ts`. Installed/locked Next is `16.3.8` and sharp `0.35.5`. Preserve this patch before any reset, clean, or redeployment. The commit alone does not identify the deployed release.
- The configured server-only Supabase credential returned HTTP 401 in an owner-run zero-row check. Do not restore that credential before addressing the signup auto-confirmation and database role-assignment findings in the audit.
- Live catalogs confirm critical anonymous writes on six tables and unprotected self-assignment of `profiles.role`. Public proposal view and permissive policy issues also remain. No production data was changed to demonstrate them.
- Current Supabase Free-plan usage is low, but scheduled project backups are unavailable. The matching Hetzner server is named `OpenClaw` in its console; automatic backups are disabled and no snapshots exist. R2 bucket `the-wedding-market` contains 31 objects, about 7.35 MB, and still uses public `r2.dev` delivery without a custom domain.
- UFW is active, SSH password authentication is disabled, the origin TLS certificate is currently valid, and the application environment file is mode 600. Direct-origin HTTPS is reachable outside Cloudflare; no Hetzner cloud firewall is applied. Existing host firewall controls still operate.
- The Wedding Market Cloudflare zone is on Free, uses Full rather than Full (strict) origin TLS, and permits a TLS 1.0 minimum. No custom or rate-limiting rules are configured. HTTP currently redirects to HTTPS even though the edge Always Use HTTPS toggle is off. These settings were inspected without changing them.
- Web typecheck/lint/20 tests/build and mobile typecheck/lint/28 tests/Expo compatibility/Android export passed during this audit. These checks use the local baseline, not the complete uncommitted server patch.

The audit added documentation and diagnostic utilities only. No app fixes, database policy changes, deployments, plan changes, or credential rotations were authorized by the audit request itself. Consult the report for current external-control verification limits and the temporary audit-access handoff.

From the repository root:

```powershell
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

From `mobile`:

```powershell
npm run start
npm run check
npm run export:android
npm run build:android:preview
```

Run builds or deployments only when the current task calls for them. Existing environment values should remain in their configured files or services; this handoff deliberately contains no secrets.

## Previous chats recovered

These IDs allow a future chat to retrieve more detail through the chat-reading tools. Titles below are the titles returned by those tools.

| Chat | ID | Relevant context |
| --- | --- | --- |
| Fix quote API and language | `01a01548-00f5-7b03-b415-198c7389e59a` | Latest fixes, simplified forms, pushed commits, and queued preview build |
| Update create account flow | `01a01036-64d7-7ed0-9acf-e78afcf31b12` | Costa Rica scope, signup fields, optional planning data, and mobile menu |
| Fix email template rendering | `01a01120-08bd-7860-a201-c9a9304ed24f` | Email appearance, recovery callbacks, hosted templates, and actual server deployer |
| Improve vendor client messaging | `019ff671-67f4-7312-97fb-436ff87be3d8` | Cross-platform messaging, password recovery, Expo alignment, and server Git ownership |
| Assess mobile app version | `019ff642-54a6-73a0-a154-3b5e84297463` | Mobile stabilization, validation, and release work requiring external setup |
| Deploy app to Hetzner server | `019fa934-55df-7671-9e3a-3376d39fdf28` | Original hosting, separate DW application, DNS, and TLS |
| Refine vendor fields | `019d97e3-f69a-7a80-bfbe-f6ba5f0434f8` | Category-specific vendor content, seeded local data, and media rendering fixes |
| Apply Playfair and Google Sans | `019d8961-a4dc-7ce2-88ce-f0001ee30145` | Typography and homepage design decisions |


## October 19 audit remediation

The user subsequently authorized a complete recheck and fixes on codex/audit-remediation. The mobile app is development/testing only. Paid Hetzner backups were explicitly declined. See audit-2026-10-19/remediation-progress.md for current live versus staged status. Database migrations 000 through 005 are recorded; 001 through 005 were applied and verified. Cloudflare Full (strict), minimum TLS 1.2 and HTTPS redirect, Supabase password minimum eight, an active R2 media domain, and server deletion protection are live. The application and post-deployment contact/MFA policies are deployed. See the verified rollout below for completed credential repair and the remaining recovery work. Audit SSH remains unprivileged; do not grant it broad sudo. Preserve the separate DW application.


### Verified rollout and remaining owner handoffs

Application release 60cbcb5085d71b60100fa5c91e52b99079001740 is live. Database migrations 000–005 are recorded and 001–005 applied, with independent verification. Origin allowlisting/API limits are installed; direct-origin HTTPS is 403 and the public directory loads. The full prior checkout is /var/www/wedding-market.before-20261019-185347. The daily encrypted R2 backup timer is active, all 31 objects were verified, and an explicitly approved encrypted archive copy is in ignored .cache/private-backups with a matching SHA256. The original recovery key remains root-only on the server. The owner chose a hidden passphrase and approved a separately encrypted identity copy to ignored .cache/private-backups; its checksum matches and neither plaintext nor passphrase was read. The owner repaired the service credential through a hidden prompt: its zero-record probe passed, only Wedding Market restarted, and an independent health check returned 200. Supabase database backup/password discovery, SSL enforcement (requires reboot), SQL network allowlisting and bucket-scoped R2 credential rotation remain. Current owner tools are in /root/wm-security-finish-20261019. No paid backup subscription was enabled.

### Subsequent code review

The owner then requested a review of the implementation and improvements where justified. See [code-review-2026-10-19.md](code-review-2026-10-19.md). Local changes unify web/native quote submission, validate prices against the actual PostgreSQL integer bound, isolate notification failures after saving, reuse request authentication for uploads/push registration, fix upload/cancellation failures, preserve date-only wedding dates across time zones, and batch large shortlist lookups. Web tests/typecheck/lint/build, database regressions and mobile checks/Android export passed. Local data-backed smoke testing is limited because .env.local points to offline local Supabase. These application changes are not yet deployed; do not confuse this source revision with the live 60cbcb50 release. Earlier infrastructure handoffs remain open.


### Profile and editing UX improvements

The owner also requested improvements to product UX, profiles and adding content. See [the implementation review](ux-2026-10-19/implementation-review.md) and its synthetic screenshots. The local batch adds a guided vendor workspace, section draft retention/save feedback and leave warnings, category-aware/custom package editing, safer team additions/removal and responsive public pricing/quote actions. Native saves/media refreshes preserve sibling drafts; shared service/pricing rules and labels keep both clients consistent. Web section replacement uses the already-deployed atomic RPC. Event types are edited only under Contact to avoid cross-section stale writes. Profile price conversion respects bigint columns and JavaScript-safe cents, including CRC amounts. Successful account-backed saves and real-device acceptance still require follow-up because local Supabase is offline. These changes and the earlier code-review batch are not deployed; live remains 60cbcb50. Infrastructure handoffs above remain unchanged.

### Website header and phone menu

The owner requested a better mobile menu and header. The responsive website now shares one sticky header across the homepage and interior pages. A scrollable modal phone menu exposes categories, role-specific account/inbox links, search and pinned English/Spanish controls. Desktop vendor navigation opens on click and supports Escape and Enter search. The duplicate homepage header/auth observer was removed. See [the header implementation review](header-2026-10-19/implementation-review.md) and screenshots. Production build, TypeScript, ESLint and 49 web tests passed; guest and synthetic account states were checked at phone, landscape and desktop widths. Real account-backed flows remain limited by offline local Supabase. This batch does not change native Expo navigation and is not deployed. Live remains 60cbcb50; earlier infrastructure handoffs remain open.

### Deployment default requested by the owner

The owner then explicitly instructed: "Always deploy the changes." Completed, verified application changes should now be deployed and checked live by default; a local commit alone is not completion. This supersedes the earlier per-batch decision to leave application changes local. The existing audit account still has no deployment privileges, and the managed release is private to deploy/root. Prepare and upload checksum-pinned owner tools and request only the necessary final root-terminal execution when that boundary applies; do not grant the audit account broad sudo. Subsequent deployment tooling supports the managed release symlink, rejects baseline/process drift, preserves credentials, probes the new header and protected APIs, and keeps the preceding release for rollback. Current deployment progress is recorded in the header release handoff.

### Verified header/profile/code deployment and direct-deploy request

The website is now deployed as `2f0a556df693d150ff3b10d1ec5a1b631bf06f6d`, superseding the earlier `60cbcb50` status above. Shadow/live and independent public checks passed for health, pages, bounded directory results, protected web/native APIs, security headers and origin rejection. The live English/Spanish phone menu and 19-category expansion were verified in the browser. Previous release: `/var/www/wedding-market.before-20261019-212910`. The first attempt stopped before switching because its isolated clone already had the deployment branch; a real Git regression and corrected checkout passed. See [the deployment receipt](header-2026-10-19/deployment.md).

The owner then said: "I want you to make the deploys" and installed the narrowly scoped root-owned gateway. Its sole sudo command and invalid-argument rejection were independently verified. The assistant then deployed `76a109e77368d11cc1554dd42bd806de9e288906` through it; the detached job exited 0, the exact-commit receipt recorded successful shadow/live probes, and independent public checks passed. Live is now `76a109e7`, with rollback at `/var/www/wedding-market.before-20261019-213949`.

Routine deployments now require no owner terminal handoff: prepare a release against the verified live commit, upload only manifest/bundle data and invoke `sudo -n /usr/local/sbin/wedding-market-release <manifest-sha256>` via the existing audit identity. The fixed installed helper cannot be replaced by an upload; privileged helper updates still require owner installation. Git, npm/builds, Node probes, PM2 and writes in deploy-controlled directories run as `deploy`. Jobs survive SSH disconnection. The exact connection/key-file paths and installed digests are recorded locally in ignored `.cache/deployment-connection.json`, without key contents. See [the completed setup and operator proof](header-2026-10-19/direct-deployment-setup.md). Native binaries and the earlier database-backup/network/R2 owner handoffs remain outstanding.

### Warmer wedding styling

The owner approved the new menu layout but found the styling too cold for weddings. Preserve that structure and navigation behavior. The styling pass uses ivory/champagne surfaces, warm cocoa/brown actions, softer serif category cards, a subtle code-native botanical detail and a welcoming guest panel. English/Spanish, long category names, 320-pixel phones, landscape, desktop and synthetic account states were checked; text contrast was calculated. The assistant deployed `0b952c4acf1fe2f5027cab106c642aef1cdca7a3` through the installed gateway. Shadow/live, public API/security/origin checks and live bilingual phone/desktop inspection passed. Rollback is `/var/www/wedding-market.before-20261019-214941`. See [the styling review](header-2026-10-19/warm-styling.md) for receipts and live screenshots. Native binaries and earlier infrastructure handoffs remain unchanged.

### Richer public vendor profiles

The owner found the public vendor profiles too simple, using the Golden Union 6 destination-planning page as a reference. The shared profile redesign adds a photo-led introduction, warmer serif typography, numbered story/service sections, a desktop quote card and a pinned phone action. Gallery accessibility and section scrolling were improved. Preserve real vendor data, category-specific fields, guest contact/price restrictions and vendor inbox behavior. The assistant deployed `3254c5b2f336299e8f5543301b385cb695de2f1b`; all 51 web tests, typecheck, lint, final production build, shadow/live probes, independent public security/origin checks and live bilingual responsive inspection passed. Rollback: `/var/www/wedding-market.before-20261019-220621`. See [the implementation review](vendor-profile-2026-10-19/implementation-review.md) for receipts and screenshots. Signed-in acceptance remains synthetic because local Supabase is offline. This is the responsive website; it does not publish a native app build. Earlier infrastructure handoffs remain outstanding.

### Account inbox organization

The owner supplied a Samsung Browser screenshot and requested better organization of the account inbox. The redesign uses compact localized account navigation, one page heading, shared client/vendor conversation cards with labeled details and visible actions, scoped search/folder links, helpful empty states and a compact account footer. Existing server loaders/actions and ownership checks remain in place. See [the inbox implementation review](inbox-2026-10-19/implementation-review.md) for validation and deployment status. Preview conversations are fictional; do not copy the owner's private screenshot records into fixtures or notes.

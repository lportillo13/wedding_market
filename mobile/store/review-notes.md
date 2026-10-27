# App review preparation — October 27, 2026

Publisher confirmed by the owner: **PORTILLO'S DESIGN CR LLC, Florida, United States**. Support: **hello@thewedmarket.com**; inbound delivery confirmed. Website: https://thewedmarket.com. These answers reflect the owner-confirmed launch model and are specific to Wedding Market, informed by Digital Wedding's 2.1(b) review hold.

**Current owner decision: keep private testing until real vendors join.** Do not send either app to public review or release it publicly until that instruction is superseded. All public listings were confirmed tests and hidden with their records preserved. The live directory is empty. See [the current launch handoff](../../docs/mobile-launch-2026-10-27/README.md) for exact build, upload, private rollout and disclosure receipts.

## Business model answers

1. **Who uses paid content/services?** Couple and vendor accounts are free. Wedding Market does not sell paid digital content, account access, memberships, subscriptions, credits, listing fees, commissions or sponsored placements in this launch. Couples may separately purchase real-world wedding services from vendors.
2. **Where are purchases made?** Contracts, deposits, payments, cancellations and refunds for wedding services are arranged directly between the couple and vendor. Wedding Market provides discovery, inquiries, proposals and private conversations. It has no in-app checkout or payment processing for these agreements.
3. **What previously purchased content/services are available?** There are no paid digital entitlements or prior-purchase unlocks. Vendor proposals describe real-world wedding services. Access to discovery and account features does not depend on a previous purchase.
4. **What can be used without In-App Purchase?** Discovery, vendor photos/details, favorites, wedding preferences, individual/group quote requests, separate vendor conversations, independent proposal acceptance, and vendor profile/media/availability/proposal management are free. No In-App Purchase is offered.
5. **Are physical services bundled with paid digital content?** No. This release has no paid digital bundle, subscription, promotion or sponsored listing. Service agreements remain between each couple and vendor.

The relevant starting point for physical services is [Apple guideline 3.1.3(e)](https://developer.apple.com/app-store/review/guidelines/#other-purchase-methods). Reassess both stores' rules before introducing paid digital access or promotions.

## Review accounts and walkthrough

Both dedicated client/vendor review accounts are email-confirmed and normal password sign-in works on the intended backend. Their generated credentials are saved, with specific owner approval, only in Apple/Google's private reviewer fields and protected ignored credential storage. The isolated vendor password was rotated after diagnostic exposure, and both stores were updated; use only the current protected record. No production administrator login is provided. Never print private Notes fields without credential redaction.

One controlled unpublished vendor and one fictional private inquiry/invitation support a review walkthrough without populating the public directory. The wedding is in San José on November 15, 2027, with 40 guests. A project SQL administrator created this private fixture; it did not exercise the normal public inquiry-creation RPC, which correctly requires a published vendor. Normal authenticated HTTP/RLS checks verify both roles can read only their private thread, two messages, two quote revisions, retry deduplication, sender-role spoofing denial, persisted notifications, two-way blocking and private reports. Installed-device acceptance remains separate.

For the current private build:

1. Browse the neutral home/category screens and switch English/Spanish. The empty public directory is intentional while waiting for real vendors.
2. Sign in as the isolated couple and open the existing fictional inquiry in the inbox. Verify the message history and both proposal revisions are visible.
3. Sign out, then sign in as the isolated vendor. Open its private inquiry, ask/reply before and after a proposal revision, and confirm the couple's existing messages remain visible. Keep the vendor unpublished.
4. Opt in to message/quote notifications on the signed installed app. Check foreground, background and closed-app receipt and tap routing separately for both roles; also check logout and account switching. Persisted database notification rows are not proof of APNs/FCM delivery.
5. Verify report/block/unblock controls on the controlled private thread. Restore access after the check. A report is private and does not by itself establish wrongdoing.
6. Open the bilingual privacy, terms, support and community pages and bundled font license. Verify restart/upgrade/logout and session storage on the installed candidate.

Before a later public submission, use approved isolated fixtures to verify public inquiry creation, two independent group vendors' bookings/contact consent/review eligibility and the provider/MFA moderation/deletion drill. Do not publish fictional businesses to create screenshots, purge either store-review login, or use a customer as a deletion test. Full deletion needs a separately approved disposable account, origin media/Auth cleanup, CDN/backup review and actual confirmation receipt. Keep the documented 30-day deadline and retryable status accurate.

## Release controls and evidence

Version is 1.0.0; permanent identifier is `com.theweddingmarket.app`. Current native source is `803b7a67b7b0e928e6f72a10e36a3f1219732e9a`. The actual Android/iOS source archives each match 103 files / 1,099,205 bytes and exclude credentials. Android 6 and iOS 5 signed artifacts passed their platform inspections. All 65 native tests, typecheck/lint, architecture boundaries and production HTTPS exports pass. Android 6 is active in the existing owner-only Play internal track; iOS 5 is **Testing** in the existing one-tester TestFlight group, with bilingual instructions saved. Apple store preparation selects build 5 and manual release, independently read back after reload. These facts do not establish physical-device behavior.

Signing ownership, configured push credentials, target SDK/native-library alignment, native privacy/permission manifests and actual production endpoints have artifact/configuration evidence. Android EN/es-419 captures are uploaded; iPhone/iPad EN/ES captures and physical notification/session acceptance remain outstanding. Keep upload, processing, private testing, public submission, approval and public install receipts distinct.

Keep Android updates in the existing **internal** track and TestFlight in the existing manual owner-only group. Google listing/data-safety/audience/rating/access/no-ads/no-Advertising-ID fields are saved; the listing is ready to send for review but remains unsubmitted. Apple privacy is published, with manual release/free pricing/content rights and the approved 174-storefront scope excluding mainland China. Do not interpret a saved privacy label or private rollout as a public app release. Both public production releases remain inactive.

# App review preparation — October 26, 2026

Publisher confirmed by the owner: **PORTILLO'S DESIGN CR LLC, Florida, United States**. Support: **hello@thewedmarket.com**; inbound delivery confirmed. Website: https://thewedmarket.com. These answers reflect the owner-confirmed launch model; verify the final binary before entering console declarations. They are specific to Wedding Market, informed by Digital Wedding's 2.1(b) review hold.

## Business model answers

1. **Who uses paid content/services?** Couple and vendor accounts are free. Wedding Market does not sell paid digital content, account access, memberships, subscriptions, credits, listing fees, commissions or sponsored placements in this launch. Couples may separately purchase real-world wedding services from vendors.
2. **Where are purchases made?** Contracts, deposits, payments, cancellations and refunds for wedding services are arranged directly between the couple and vendor. Wedding Market provides discovery, inquiries, proposals and private conversations. It has no in-app checkout or payment processing for these agreements.
3. **What previously purchased content/services are available?** There are no paid digital entitlements or prior-purchase unlocks. Vendor proposals describe real-world wedding services. Access to discovery and account features does not depend on a previous purchase.
4. **What can be used without In-App Purchase?** Discovery, vendor photos/details, favorites, wedding preferences, individual/group quote requests, separate vendor conversations, independent proposal acceptance, and vendor profile/media/availability/proposal management are free. No In-App Purchase is offered.
5. **Are physical services bundled with paid digital content?** No. This release has no paid digital bundle, subscription, promotion or sponsored listing. Service agreements remain between each couple and vendor.

The relevant starting point for physical services is [Apple guideline 3.1.3(e)](https://developer.apple.com/app-store/review/guidelines/#other-purchase-methods). Reassess both stores' rules before introducing paid digital access or promotions.

## Review accounts and walkthrough

Dedicated client/vendor review accounts are still required on the actual review backend. Keep credentials only in private console access forms and an approved private credential store. No production administrator login is needed. The 152 confirmed seeded vendors were hidden/restricted; do not reuse them as review accounts or make fictional vendors public in the live directory. Use an isolated review environment/fixtures and confirm the binary's configured backend.

1. Browse vendor photos/details and switch English/Spanish.
2. Sign in as the fictional couple, accept the current posting rules, set date/guests, save a vendor and send an individual inquiry.
3. Send a group inquiry to two fictional providers; each must see only its own conversation.
4. As each provider, ask a question before pricing, send/revise a proposal, and reply after acceptance.
5. Accept each provider independently; confirm contact consent, review eligibility and notifications stay isolated.
6. Report the selected public listing/conversation, block/unblock the other participant, and verify server denial of new messages/proposals/inquiries while blocked. Blocking does not cancel a separate contract.
7. Initiate full-account deletion from the app account controls with confirmation. The app records a request/reference and a 30-day deadline; support email is not required. Complete the MFA operator drill, including media/CDN/backup review and confirmation delivery, before claiming end-to-end verification.
8. Open the bilingual privacy, terms, support and community pages. Confirm the exact labels and behavior from the signed candidate.

## Release controls and evidence

Version is 1.0.0; permanent identifier is `com.theweddingmarket.app`. Real Android/iOS source archives were inspected (94 files, approximately 1.1 MB each); this is source packaging evidence, not a signed build. Local Hermes exports also do not establish production configuration or physical-device behavior.

Play needs a signed production AAB; Apple needs a signed device IPA and matching App Store Connect record. Verify signing ownership, push credentials, target SDK/native-library alignment, native privacy/permission manifests, backup/session security, actual production endpoints and EN/ES device screenshots. Record source/artifact hashes and separate upload, processing, submission, approval, release and public-install receipts.

Keep Android EAS submission **internal/draft**. Configure managed publishing in Play and manual public release in Apple deliberately. No new signed cloud build, store submission or public app release has been performed in this preparation work.

# App review notes — draft, October 26, 2026

Use this draft for Wedding Market only. It is based on current source and the published terms; verify it against the final binary and confirm the business model with the owner before entering store declarations. Do not copy Digital Wedding's paid web-hosting explanation: Wedding Market has different users and functionality.

## Business model explanation

The Wedding Market connects couples planning weddings in Costa Rica with wedding-service providers. Couples can discover providers, save favorites, request proposals, and communicate privately with each invited provider. Providers manage their profile, media, availability, and proposals. This app supports account creation; it is not restricted to existing Digital Wedding customers.

The reviewed native source contains no consumer checkout, digital credit purchase, paid feature unlock, or subscription purchase flow. Current terms describe bookings, contracts, cancellations, and payments for wedding services as agreements directly between the couple and provider. Public sponsored placements remain disabled. Confirm whether vendor access, membership, listing fees, commissions, or any previously purchased access exist before calling either role free in review notes. Confirm the legal publisher separately.

Apple previously asked Digital Wedding these five questions. Prepare factual Wedding Market answers in advance:

1. **Who uses the paid content or services?** Couples arranging wedding services and providers offering those services. Explain separately any fees paid to Wedding Market; these are not established by this source review.
2. **Where are purchases made?** Current terms place wedding-service agreements and payments directly between couples and providers. No native checkout was found. Verify the release candidate and owner business model.
3. **What previously purchased content/services are available?** Vendor proposals and communications about real-world wedding services. Do not claim there are no paid digital entitlements until vendor membership/access is confirmed.
4. **What can be used without In-App Purchase?** Describe the actual accessible discovery, planning, quote, messaging, and vendor-management features. Identify any paid access explicitly.
5. **Are physical goods/services bundled with digital content?** Current terms cover wedding services; no bundled native checkout was found. Confirm no paid digital listing, promotion, or membership bundle before submitting this answer.

Physical wedding services and paid digital promotion/access must be evaluated separately. The relevant starting point for physical services is [Apple guideline 3.1.3(e)](https://developer.apple.com/app-store/review/guidelines/#other-purchase-methods); this is a preparation assessment, not a promise of approval.

## Review accounts and walkthrough

Create dedicated, least-privilege fictional client and vendor accounts and sample listings on the actual review backend. Keep credentials only in each console's private app-access form and an approved private credential store. Do not put them in this folder, screenshots, source, app binaries, or build archives. Reviewers do not need a production administrator login. Do not send invitations or messages to real customers.

Give both reviewers access through the complete review period. Exercise these steps before declaring accounts ready:

1. Browse sample vendor profiles and photos; switch English/Spanish.
2. Sign in as the fictional client, set date/guests, save a vendor, and send an individual request.
3. Send a group request to two fictional providers; verify each sees only its own private conversation.
4. As a fictional provider, ask a question before a proposal, send/revise a proposal, and reply after acceptance.
5. As client, accept each provider independently; confirm contact consent and notifications remain isolated by provider.
6. Demonstrate working account deletion and report/block controls once implemented. Current email-only deletion and missing moderation controls are launch blockers; do not describe them as complete.
7. Show privacy, support, and account controls. Record the exact menu labels in each language from the final candidate.

## Release controls

An Android APK is for direct testing; Play distribution requires the signed production AAB. iOS distribution requires a signed device IPA and the matching App Store Connect record. Uploaded, processed, submitted, approved, released, and publicly installable are separate states; retain receipts for each. Prefer manual public release for Apple and managed publishing in Play so approval does not unintentionally launch the app. The EAS Android submission default is internal/draft; submitting or publishing remains a separate action.

# Boutique microstores — October 28, 2026

The owner selected **Editorial boutique** for the website and native app. The first version adds dresses and suits, individual boutique storefronts, private outfit favorites, and fitting requests that the store confirms. It inherits the existing GT Super / Acumin / Lucia typefaces, warm surfaces, photo-led cover, restrained controls and existing global navigation structure.

## Implemented experience

- `/boutiques` lists enabled boutiques belonging to published, unrestricted vendors. `/boutiques/[slug]` presents the cover, dress/suit collection, garment details, photo/video gallery, boutique information and visit policies. Saved outfits are at `/boutiques/favorites`.
- Vendor → Boutique collection (`/vendor/boutique`) manages the storefront, visit duration, companion limit, optional visit fee, bilingual policies and up to 60 outfits. Each outfit has category-specific details, sample/order sizes, purchase/rental terms, preparation time, optional price and up to six selections from the existing vendor media library. Existing upload limits remain unchanged.
- Couples submit a preferred date/time in Costa Rica, optional wedding date, companions, up to five outfits, optional sizing/budget/message and acknowledgement of the current visit policies. Available profile planning data is prefilled. The store confirms or declines; either participant can cancel. A private conversation is available within the appointment detail.
- Appointment entries live inside the existing client/vendor inbox navigation at `/account/inbox/appointments` and `/vendor/inbox/appointments`. A fitting confirmation is separate from reserving an outfit, accepting a quote, disclosing contact details or becoming eligible for a booking review. Existing service bookings are unchanged.
- Native Home/Search expose Dresses & suits; Favorites exposes saved outfits; Inbox exposes appointments; vendor Profile exposes collection management. Bottom navigation and the Expo entry point remain intact. Uploaded outfit videos open in the device player/browser; web videos use user-controlled playback.
- Accounts remain free. Purchases, rentals, any visit fee and service agreements are handled directly with the boutique. Calendar synchronization, email/push appointment reminders and instant booking are outside this version.

## Privacy and bounded resources

Migration `202610280013_boutique_microstores.sql` adds five RLS-protected tables and scoped RPCs. Only the owning vendor can manage a store or outfit. Only the appointment's client/store can read it or its messages. Guest/vendor viewers cannot retrieve client-only outfit prices or contact details through the public projection. Private responses use `private, no-store` and are never shared through a directory cache.

Requests and messages have stable retry IDs. A changed retry cannot replace an existing conversation. Request creation captures the selected outfits and the exact visit-policy/fee version. Store confirmations serialize on the boutique and reject overlapping confirmed visits and stale decisions. Existing account restrictions, community posting consent, public vendor reporting and two-way contact blocks remain enforced. Account removal cascades the new account-owned data without changing other stores' bookings.

Public and appointment pages use fixed 12-record pages; owner collections cap at 60, favorites at 200, pending client requests at 20, message reads at 50 and conversation storage at 500. Media selections reuse admitted uploads. JSON writes bound actual streamed bytes to 30 KB and reading time to five seconds. Refreshes run in the foreground with an in-flight guard and a five-second wakeup cooldown. Private screens bind to the authenticated identity; native account changes remount the application content.

## Validation and live database

- Website architecture, TypeScript, lint, production build and **104 tests** pass.
- Database replay/inspection and **47 database checks**, including the new rollback-only live-verification regression, pass. Existing unrelated unindexed foreign keys are unchanged.
- Tooling **14 tests** pass. Native TypeScript/lint and **78 tests / 18 suites** pass. Expo dependency validation passes. Android/iOS Hermes exports include the new feature and existing eight font/icon assets.
- Actual React storefront/outfit components and compiled website styles were rendered with explicitly fictional data for visual review. English at 390px and Spanish at 320px fit without horizontal overflow; the expected GT Super display face loads. These captures establish layout, not authenticated browser mutation acceptance. Fictional review records/images were not published to the directory.
- The verified **WedMarket / CR Wedding Destination** project applied migration 013. All five new tables have RLS enabled. The ledger source matches after Windows CRLF normalization: see [source checksum](migration-source.json) and [live receipt](migration-live-receipt.json).
- The live rollback-only script exercises catalog price masking, private favorites, exact/changed retries, store-only confirmation, overlap rejection, message and appointment isolation, cancellation and separation from service bookings. It leaves zero synthetic accounts, vendors or appointments. Its source is [the live verification script](../../supabase/tests/verify-boutiques-live.sql); its result is recorded alongside this handoff.

No signed native artifact, OTA update, store upload or app release is part of this batch. **The native release remains held.** No new physical Android/iPhone acceptance is claimed; both platform bundle checks are local compilation evidence. No real customer/store appointment was submitted for testing.

Deployment/public verification is recorded here after the restricted gateway finishes. The source does not assume a gateway job succeeded merely because it was accepted.

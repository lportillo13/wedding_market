# Footer and floating terms notice — October 27, 2026

The owner identified an account terms notice above the homepage hero and requested a footer redesign. They specifically clarified: **"Terms a floating box in the footer."** Website updates remain authorized; app release stays held.

The consent component now sits after the footer in the layout and floats at the bottom of the viewport. It does not participate in page height or push the hero below the overlay header. It can minimize to a Review terms button and reopen, with keyboard focus restored to the relevant control. The panel fits a short phone viewport and scrolls internally when necessary. Footer clearance keeps the collapsed button from covering the last links.

The existing terms version, legal text, authenticated eligibility and server RPC remain unchanged. The checkbox is controlled, the submit action is disabled and guarded until checked, concurrent submissions are prevented and failed saves retain the review state. Closing the panel is not acceptance and does not remove server enforcement. Policy links open separately so the review form is retained. The notice follows the current EN/ES selection.

The public footer now has a light serif wordmark, restrained newsletter block, visible Explore and service-category links, vendor entry point and support contact. Legal links wrap with readable touch targets. The verified publisher/contact identity is retained; unsupported store/social links remain hidden. Account and onboarding routes still use their compact workspace footer without the newsletter. Newsletter submission retains the existing endpoint and adds a bounded timeout.

## Validation

- Browser checks at 1440×1000, 390×844 and 320×740 confirm the floating layout, no horizontal overflow, readable email focus styles and EN/ES wrapping.
- Local consent-only fixture checks verified disabled/enabled checkbox behavior, minimize/reopen, focus handoff and retained state. No terms acceptance RPC or newsletter subscription was submitted. The temporary fixture was removed before building; it is absent from production routes.
- ESLint, all 90 root tests, architecture checks and production TypeScript/build passed. An initial build found stale generated types for the removed local fixture; only the verified development cache was cleared, and the subsequent build passed.
- No migration, legal document revision, native source or app release is included.

Deployment and live verification will be recorded after the exact release receipt.

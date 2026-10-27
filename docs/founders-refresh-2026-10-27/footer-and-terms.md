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

## Verified release

Website commit **ac0676d15c5c4ec0b606f898bdf7020c691b7586** is live with the successful exact-commit [gateway receipt](footer-terms-deployment-success.json). Rollback is `/var/www/wedding-market.before-20261027-215023`. The gateway's health and anonymous authorization probes passed before and after switching.

[Public verification](footer-terms-public-checks.json) passed for EN/ES home, directory, legal and compact onboarding footer rendering, all three served stylesheets, fixed-position notice CSS and the absent local fixture route (404). The first public verifier expected a literal support email; Cloudflare protects it in HTML. Decoding the public protection value confirms the unchanged `hello@thewedmarket.com` address, also visibly restored in the browser.

Live browser measurements confirm no horizontal overflow at 1265px desktop and 375px phone content widths. Header/hero tops remain 24px/12px on desktop. The live footer has readable focus states, wrapping legal links and correct publisher/support details; [public-only desktop screenshot](live-footer-desktop.png). The current browser account already has terms accepted, so its notice is absent as expected; the pending-consent interactions were verified with the temporary local fixture without submitting acceptance. No newsletter was sent or consent record changed during QA.

## Tighter spacing follow-up

The owner requested less space between footer items. CSS-only website release **30ca90e3c837722ee3c7edea41de9f10495e5068** is verified with its [exact receipt](footer-spacing-deployment-success.json) and [public checks](footer-spacing-public-checks.json). Rollback is `/var/www/wedding-market.before-20261027-220721`. Production compilation and TypeScript passed; no new behavioral tests were added for this spacing change.

At the same 1265px content width, footer height fell from 680px to 532.39px (21.7%). Desktop link rows are 28px with no extra gap, and main section padding is 24px instead of 48px. At 375px phone width, navigation links retain 44px touch targets with no added gap; section padding is 20px. Neither viewport has horizontal overflow. See [measured comparison](footer-spacing-browser-checks.json) and [compact live footer](live-footer-compact.png). The floating terms behavior and held native release remain unchanged.

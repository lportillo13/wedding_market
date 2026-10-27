# Sitewide UX refresh — October 27, 2026

The owner requested a sitewide usability pass, identifying vendor signup as a particularly crowded example. They confirmed **“Update the website; hold the app release.”** The brand name is **Wedding Market** in both languages, with no translated brand or Costa Rica tagline.

## Changes

- Shared warm ivory/brown surfaces, readable form labels, 16px inputs, visible focus rings, larger touch targets and calmer page/card spacing. Existing navigation destinations, permissions, inboxes and category-specific business rules remain.
- Vendor signup now separates account, business/services, photos, location, contact and finishing details. Authenticated clients skip the account stage. Inputs and files remain mounted across navigation; completed stages can be revisited; final submission rechecks prior required fields and selections. Secondary questions and the review summary are collapsible. File admission and server-side creation checks are unchanged.
- Couple signup shows copy/fields immediately on web and native instead of withholding controls during a typewriter animation. Password visibility is available in web signup/login and native authentication/recovery.
- Directory search has clear full labels, filter reset, useful empty-state actions and no disabled-advertising spacer blocks or unnecessary one-page pagination.
- Vendor overview has direct inbox/profile/publishing actions. Phone workspace navigation and profile editing use labeled section selectors; profile drafts and existing save/leave protection remain.
- Account/quote forms share the calmer form surface. Quote essentials and the message are grouped ahead of secondary optional questions. Clearing all selected vendors asks for confirmation; per-vendor remove controls have names.
- Narrow-phone login/recovery no longer accumulates nested card padding; the wordmark stays on one line. Login’s English-only eyebrow/divider is localized. Blog removes the redundant statistics panel, including its hardcoded demo count, and uses a smaller mobile title.
- Native source includes the same brand-name treatment, immediate signup, larger/clearer controls, section/theme selectors, and a calendar for the profile’s tentative wedding date. No new signed build, EAS update, store upload or release is authorized or performed in this batch.

## Typography decision

The initial Bellefair / Mrs Saint Delafield / Jost experiment was rejected and removed from release sources. The selected direction is **Ms Claudy + Adobe Garamond Pro**, but the owner explicitly requested **previews/license details without purchasing**. Exact publisher-rendered specimens and the [typography preview](typography-preview.html) are saved here. [Licensing notes](font-licensing.md) distinguish logo, web and app usage. Website/native typography retains the existing setup until appropriate licensed assets are available. The fixed header wordmark now says only Wedding Market; it is an interim treatment, not the licensed Ms Claudy final logo.

## Validation and release

Root type checking, lint, architecture and production build pass; 90 web tests pass. Native type checking/lint and 75 tests pass; online Expo compatibility and Android/iOS Hermes exports pass. A first restricted export failed because Hermes could not write its temporary output; the verified rerun used the workspace temp directory and succeeded. No failed run is counted as a pass.

Guest browser checks cover 320px and 390px phone layouts and a 1440px desktop layout, with no horizontal overflow in the checked routes. Signup progression, password visibility, uploaded-file retention and back navigation are exercised with synthetic values without submitting an account. Local directory data is unavailable, so real-category and signed-in workspace rendering also require the live read-only verification recorded with the release. [Responsive checks](responsive-checks.json) and screenshots document the inspected layouts. Native bundle success does not establish installed-device visual acceptance.

The pre-release live gateway receipt and resolved application path identify `25e8f7b6bb4964d2ac55f6a84e23185fc4303c56`. The restricted audit account cannot read the deploy-owned checkout’s Git directory; the fixed gateway is responsible for its own authoritative drift checks. Release receipt and independent public checks are recorded separately after deployment. No schema change or migration is included.

Final website release: **519a06c36c228d45c61d5300b157341205e920ce**, verified by the [exact gateway receipt](deployment-success.json) and [independent public checks](public-release-checks.json). Rollback: `/var/www/wedding-market.before-20261027-201404`. The signed-in [phone workspace check](live-workspace-checks.json) confirms section controls, no overflow and no newsletter on the nested vendor profile. A route-boundary regression suite preserves the directory and public pages while keeping all nested workspaces compact. The [live directory capture](live-directory-mobile.jpg) preserves the truthful empty directory. Website only; native release and paid typography remain held as requested.

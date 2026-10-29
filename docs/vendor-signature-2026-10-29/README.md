# Vendor information — centered signature C

Historical design: the owner subsequently switched to [A — Editorial identity](../vendor-editorial-2026-10-29/README.md). The category translation improvements from this release remain included.

The owner reviewed three vendor-logo treatments and selected **C — Centered signature**. The chosen image is archived as `selected-option-c.png` (built-in imagegen preview; not a runtime asset). Its brief was a centered company mark above a light serif heading and script category, icon facts, a centered short summary and a left-aligned longer story.

The information section now uses the existing vendor logo in a fine circular frame, with initials when a logo is missing or fails. The logo uses contained sizing and lazy loading; no optimizer cache or new media store is introduced. Breadcrumbs remain above the signature. The story eyebrow moves into the signature; the team-size fact joins experience, languages and event types. Facts form a quiet row on desktop, two columns on tablet and a single column on phones. Service-specific spaces/details and the existing public website destination remain.

Category labels missing from the home-page shortlist now have EN/ES translations, shared by the cover and information signature. Unknown custom categories retain their supplied labels, including keys resembling object-prototype properties. A logo-only vendor also qualifies for the information section. No account/private contact, quote, gallery, availability, sample submission or media admission rules changed.

## Validation and release

Architecture, TypeScript, ESLint, production build and all 109 existing web tests pass. The category regression check includes music translation and an unknown prototype-like key. Production-preview checks at 320/390px, tablet 900px and desktop confirm the contained initials seal, centered heading/summary, stacked or row facts, and no horizontal overflow. English music/category/fact labels switch correctly; Spanish was restored. Villa Brisa retains its two service-space cards, and Luz de Abril uses the same signature. See `local-browser-checks.json`; no console errors were recorded. The exact publication receipt and live screenshots will be added after the fixed gateway completes.

Native app publication remains held. No database or infrastructure change is required.


## Verified publication

Website **e35e23b223f870c6fbdd5c8ba583e5fe19872481** is deployed against prior verified release `7d35a4214cd73e113a1290b49aeb975dfa8c38d8`. The fixed gateway receipt confirms this exact target and rollback `/var/www/wedding-market.before-20261029-191724`. All 12 public checks pass. Live desktop/phone alignment, logo sizing, fact layout and category checks are in `live-browser-checks.json`; actual screenshots are `live-vendor-signature-desktop.jpg` and `live-vendor-signature-mobile.jpg`. Native publication remains held.

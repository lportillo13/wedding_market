# Boutique identity — selected A/B combination

The owner requested three image options for the introduction below a boutique hero, with its own company logo and more professional navigation/filter controls. Three generated desktop/mobile concepts were shown: A, compact identity row; B, centered identity with light icon actions and underlined filters; C, editorial panel. The owner selected **A's information section with B's buttons and filters**.

The website implementation uses the vendor's existing logo, boutique name, location and two-line introduction. A restrained initials tile is the fallback for missing/failed logos; the three fictional examples have no uploaded company logos. The disclosure preserves full description, private location/contact restrictions, visit policies, reporting and the existing try-on action. The compact identity on outfit-detail pages is retained.

The top navigation now uses a back arrow, heart and calendar in a shared 44px icon/text treatment. Existing example/real favorites and role-specific appointment destinations are preserved. Collection filters have 48px targets and a fine active underline, with no heavy filled or outlined button boxes. Their state, pagination reset and existing loading/request behavior are unchanged.

## Checks and release

Architecture, TypeScript, ESLint, production build and all 109 existing website tests pass. A mobile initials wrapping issue found in visual review was corrected before publication. Final 320/390px and desktop checks confirm no horizontal overflow, 44px utility links and 48px filters. Dress/suit filters show four/two sample outfits, disclosure opens with the keyboard, EN/ES controls work, saved and appointment links reach their existing destinations, and the fitting form retains the selected outfit. The compact outfit identity is unchanged. No request was submitted. See `local-browser-checks.json`; no console errors were recorded. Publication and live proof will be added after the fixed gateway completes.

No database, infrastructure or native publication changes. Native release remains held.

## Verified publication

Website **bd61f1246541f1979928f545497de24c05478b1a** is deployed against verified prior release `9e71a33f84d0bbd0c5c274cf034bc4118da5a690`. The gateway finished successfully at that exact commit; `deployment-success.json` records the probes and rollback `/var/www/wedding-market.before-20261029-170000`.

All 13 public checks pass for the three sample boutiques, directory/favorites, an outfit deep link, health, both previously repaired vendor profiles and their stylesheets. Direct live desktop/390px/320px checks confirm the logo tile, readable identity, 44px actions, 48px underlined filters, keyboard disclosure and no overflow/console errors. See `live-browser-checks.json`, `live-boutique-identity-desktop.jpg` and `live-boutique-identity-mobile.jpg`. The screenshots use Casa Marfil, matching the original area the owner flagged. Native publication remains held.

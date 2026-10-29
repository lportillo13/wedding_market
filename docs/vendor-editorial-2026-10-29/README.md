# Vendor information — editorial identity A

The owner changed the preferred vendor information design from **C — Centered signature** to **A — Editorial identity**. The selected A preview is archived as `selected-option-a.png`.

The company logo now sits in a softly squared champagne tile beside a left-aligned eyebrow, heading and script category. Facts form a left-aligned row below, followed by a readable left-aligned summary and story. Phones keep an 80px logo alongside the heading and stack the facts below. Uploaded logos retain contained sizing and the missing/failed-logo initials fallback.

Existing category translations, breadcrumbs, service-specific details, optional website link, hero/submenu, floating quote actions and account/contact restrictions remain. This change only affects vendor information presentation; native app publication remains held.

## Validation and release

`npm run check` passes architecture, TypeScript, lint and the production build; all 109 existing web tests pass. Local browser checks confirm desktop, 390px and 320px layouts, English/Spanish identity text, retained venue service cards and no horizontal overflow or browser errors. Measurements are in `local-browser-checks.json`.

Published together with the approved [transparent cover navigation](../cover-navigation-2026-10-29/README.md) as **ba689b190e62dd43ee02f196490c1a6c2712847e**. The exact receipt is `deployment-success.json`; all 12 public checks pass. Actual desktop and phone identity screenshots are in this folder, with measurements in the cover-navigation live checks. Rollback is `/var/www/wedding-market.before-20261029-200102`.

The subsequent [alignment follow-up](../vendor-alignment-2026-10-29/README.md) removes the story width cap at the owner's request while retaining the A identity.

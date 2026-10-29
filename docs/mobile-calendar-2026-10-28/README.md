# One-month phone availability calendar

**Publication update — October 29, 2026 UTC:** This completed source is included in the verified website release **62c21d1810428720bef913339a837746932b2c15**, together with the boutique gallery expansion. The prior disk-space blocker is resolved. [Exact successful gateway receipt](../boutiques-2026-10-28/expanded-gallery-deployment-success.json). The publication/blocker notes below record the earlier state; native publication remains held.


The owner requested one visible month on phones with arrows to move between months. Below 768px, the vendor's public availability calendar now renders one month and hides the three-month slider. Previous/next controls sit beside the month name, with 44px touch targets, localized accessible labels and a live month announcement. Stable month slots preserve keyboard focus when the month changes. CSS also hides extra server-rendered months before hydration.

Desktop retains three months and the slider. Both layouts stay within the same 24-month window; switching from the last mobile month to desktop shows the final three months. Weekday labels now follow English or Spanish. Existing availability status rules, guest restrictions and vendor data are unchanged. No native application release or database changes are included.

Architecture, TypeScript, ESLint and the production build pass. Browser checks verify one visible/rendered phone month, keyboard arrows across December/January, disabled previous/next controls at both limits, all 24 months, responsive desktop restoration, English/Spanish labels and no overflow at 320px. [Browser checks](browser-checks.json) and [phone preview](single-month-mobile-preview.jpg) record the local result.

## Publication

This change is ready locally, **not live**. The exact successful website receipt still identifies **3c74fd44298b0ea85069a0d500d4f14f58ea6d84**. The latest read-only server check found 6,264,610,816 bytes available, below the fixed deployment helper's 6 GiB minimum (6,442,450,944 bytes). No release job was launched into that known precondition failure, and no cleanup or privileged-helper change was performed.

The owner has already been asked to run the existing owner-only server cleanup. After sufficient space is available, recheck the live commit and publish the latest reviewed source, including the pending gallery thumbnail repair, category reset and checked boutique gallery expansion. Keep native publication held. Prepare a fresh bundle when resuming rather than assuming an older cached bundle includes this calendar change.

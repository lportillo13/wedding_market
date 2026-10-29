# Profile submenu overflow

The owner requested only complete section labels that fit, followed by a More / Más button containing the remaining sections. The profile submenu now measures the actual label and button widths, reserves space for More and recalculates after font loading, language changes and resizing. No horizontal scroll or partially cut label is needed.

The disclosure uses ordinary navigation links, expanded/controlled state, outside-tap and focus-leave dismissal, and Escape with focus restoration. A hidden active section highlights More and remains marked inside the dropdown. The popup chooses the space above or below the bar, follows its sticky position while scrolling and has bounded scrolling of its own. Measurement nodes are hidden from accessibility and cannot expand the page width.

Architecture, TypeScript, ESLint and the production build pass. Browser checks show three Spanish links plus Más at 390px, two plus Más at 320px, all eight links without More at 1150px, English fitting, no settled horizontal overflow, 44px dropdown links, section selection, active tracking, outside dismissal, Escape and upward/downward placement. [Local checks](browser-checks.json) and [local phone proof](local-phone-menu.jpg) record the pre-release result.

The website release also includes the previously checked single-month phone calendar, thumbnail visibility repair, category-reset correction and boutique gallery expansion already committed in this checkout. Native publication remains held. Publication is only confirmed by the exact gateway receipt and subsequent public checks recorded alongside this handoff.

## Current publication state

**Published October 29, 2026 UTC in the combined release 6f7c0b5412049a9d284b75b69f93328c56991b8e.** It includes checked submenu source 2fb01dda and the collapsible footer, over prior live base 62c21d18. The exact [successful receipt](../mobile-footer-2026-10-28/deployment-success.json) and [live browser checks](../mobile-footer-2026-10-28/live-browser-checks.json) pass. Rollback is `/var/www/wedding-market.before-20261029-010445`. The [live phone capture](live-phone-menu.jpg) shows the published overflow menu.

Live checks show Información/Fotos/Precios plus Más at 390px, Información/Fotos plus Más at 320px and all eight links at 1150px. The overflow links are reachable, selection marks the hidden active section, Escape closes and restores focus, and English labels fit. The earlier calendar/gallery/filter and boutique repairs remain included. Previous-base receipts alongside this file are historical evidence.

The owner completed cleanup; available space was about 64 GB before deployment and 62 GB afterward. The fixed reserve and privileged helper were unchanged. The combined footer payload superseded the older submenu-only candidate; do not reuse its old manifest. Native publication remains held.

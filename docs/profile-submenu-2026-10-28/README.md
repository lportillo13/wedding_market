# Profile submenu overflow

The owner requested only complete section labels that fit, followed by a More / Más button containing the remaining sections. The profile submenu now measures the actual label and button widths, reserves space for More and recalculates after font loading, language changes and resizing. No horizontal scroll or partially cut label is needed.

The disclosure uses ordinary navigation links, expanded/controlled state, outside-tap and focus-leave dismissal, and Escape with focus restoration. A hidden active section highlights More and remains marked inside the dropdown. The popup chooses the space above or below the bar, follows its sticky position while scrolling and has bounded scrolling of its own. Measurement nodes are hidden from accessibility and cannot expand the page width.

Architecture, TypeScript, ESLint and the production build pass. Browser checks show three Spanish links plus Más at 390px, two plus Más at 320px, all eight links without More at 1150px, English fitting, no settled horizontal overflow, 44px dropdown links, section selection, active tracking, outside dismissal, Escape and upward/downward placement. [Local checks](browser-checks.json) and [local phone proof](local-phone-menu.jpg) record the pre-release result.

The website release also includes the previously checked single-month phone calendar, thumbnail visibility repair, category-reset correction and boutique gallery expansion already committed in this checkout. Native publication remains held. Publication is only confirmed by the exact gateway receipt and subsequent public checks recorded alongside this handoff.

## Current publication state

**The More submenu is not live yet.** Its checked source is **2fb01dda5b8e7dfebf76128dbee27ab8053cee15**. The earlier calendar, thumbnail, category-reset and boutique changes were published by a concurrent release while this submenu was being tested. The independently read successful live receipt now identifies **62c21d1810428720bef913339a837746932b2c15**, with rollback `/var/www/wedding-market.before-20261029-000851`. [Live-base receipt](live-base-receipt.json) and [live mobile checks](live-base-checks.json) confirm this distinction: thumbnails have nonzero boxes, one calendar month is rendered, and Next advances to November.

Before that release, 6,594,449,408 free bytes met the fixed 6 GiB reserve. After it completed, 4,467,896,320 remained, below the unchanged minimum of 6,442,450,944. No submenu job was launched into this known failure, and no server files or backups were deleted by this task. The previous cleanup did allow the completed release; additional build space is needed for the new submenu.

The isolated submenu candidate was regenerated against the newly verified live base 62c21d18. Its prepared manifest SHA-256 is `c5ddea0409ac73346193aeb07de6bfbfa5a5c6b4b847dd24b789ceff7d24735b`; it has not been uploaded or launched. After sufficient space is available, recheck the live base and gateway state before using or regenerating the candidate. Never reuse the earlier manifest expecting 3c74fd44. Keep native publication held.

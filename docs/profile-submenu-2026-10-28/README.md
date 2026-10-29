# Profile submenu overflow

The owner requested only complete section labels that fit, followed by a More / Más button containing the remaining sections. The profile submenu now measures the actual label and button widths, reserves space for More and recalculates after font loading, language changes and resizing. No horizontal scroll or partially cut label is needed.

The disclosure uses ordinary navigation links, expanded/controlled state, outside-tap and focus-leave dismissal, and Escape with focus restoration. A hidden active section highlights More and remains marked inside the dropdown. The popup chooses the space above or below the bar, follows its sticky position while scrolling and has bounded scrolling of its own. Measurement nodes are hidden from accessibility and cannot expand the page width.

Architecture, TypeScript, ESLint and the production build pass. Browser checks show three Spanish links plus Más at 390px, two plus Más at 320px, all eight links without More at 1150px, English fitting, no settled horizontal overflow, 44px dropdown links, section selection, active tracking, outside dismissal, Escape and upward/downward placement. [Local checks](browser-checks.json) and [local phone proof](local-phone-menu.jpg) record the pre-release result.

The website release also includes the previously checked single-month phone calendar, thumbnail visibility repair, category-reset correction and boutique gallery expansion already committed in this checkout. Native publication remains held. Publication is only confirmed by the exact gateway receipt and subsequent public checks recorded alongside this handoff.

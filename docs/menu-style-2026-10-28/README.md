# Submenu and mobile navigation styling

The owner requested a redesign focused on style rather than layout. The existing desktop search/category columns, mobile drawer, navigation destinations, account visibility rules and dialog controls remain in place. This website-only change continues the supplied GT Super / Acumin typography and the warm editorial direction. The app release remains held.

`styles/navigation-editorial.scss` gives the menus ivory surfaces, warm charcoal text, light serif headings, thin category dividers and restrained diagonal arrows instead of rounded category tiles. The search and action controls have consistent small corner radii; the account dropdown shares the same paper finish. The mobile drawer uses a clean ivory header, lighter category links, a quieter account panel and a dark footer action/language selection. The owner explicitly rejected `wm-header-botanical`; its decoration/component and unused styles are removed. Opening motion respects reduced-motion preferences. The homepage header, logo, hero and footer layout are unchanged.

## Verification

Local visual review covers desktop English/Spanish, a 390×844 phone and a 320×640 phone. The smallest dialog is 320px wide with a matching scroll width, 50px category targets, 16px search text and the footer ending at 640px. Escape closes the drawer, restores focus and unlocks body scrolling; opening through search focuses the input. Language changes keep the dialog open. Measurements are in [local-browser-checks.json](local-browser-checks.json).

The local content connection was unavailable and displayed the existing six-category fallback. The first live release confirmed all 19 managed categories, expansion from six to 19, 50px phone category targets, 44px language targets and no horizontal overflow at 320px. Live review also identified the shared legacy card skin overriding the account popup radius; local popup tokens now override that skin without affecting other cards. No data or business workflow was changed. Production build and TypeScript passed. Final live release verification is recorded below when complete.

## Further owner refinements

The owner requested lighter typography throughout `wm-home-premium-process`. Its serif heading and italic accent now use GT Super Light (300); descriptions, numbered steps, tabs and the action use regular Acumin (400). Font sizes, leading, tabs and destinations are preserved.

The owner also requested a header that stays visible while scrolling. The homepage header now remains fixed over the opening video and uses a solid warm-brown surface after 24px of scrolling. A passive, frame-bounded listener changes only this visual state and cleans up on route changes. Interior headers retain their existing sticky position. The hero arrow leaves its focused destination 16px below the persistent header; reduced-motion behavior is preserved. Local browser checks cover desktop and phone scrolling, return to the top and opening the mobile drawer from farther down the page. Type checking and targeted component lint pass.

## Final verified deployment

Website release **cb35e01ff5cd4ee7297f5144706553bc7d961306** is live. The [exact gateway receipt](deployment-success.json) confirms the successful switch and unchanged health/authentication gates. Rollback is `/var/www/wedding-market.before-20261028-143137`. The final production build and TypeScript pass; targeted component lint passes. No native build or release was started.

[Bilingual public checks](public-checks.json) confirm the pages and four CSS assets return 200, including the menu finish, scoped account popup tokens, botanical removal, persistent header and regular planning-list text. [Final browser checks](final-live-checks.json) confirm all 19 categories, a 6px ivory account popup with 44px rows, no botanical node, and planning headings at 300/body, lists, tabs and action at 400.

The live desktop header stays at top 24px and the focused hero-arrow destination begins at 116px, 16px below the header's 100px bottom. On the 390px phone it stays at top 16px, with the destination at 96px below the header's 80px bottom; document client/scroll widths both equal 375px. Returning to the top restores the transparent header state with scrollY 0. English was restored after Spanish review and temporary viewport/tab overrides were cleaned up.

Final public-only screenshots: [desktop submenu](live-desktop.png), [clean mobile menu](live-mobile.png), [sticky phone header](live-sticky-phone.png). The authenticated account identity is excluded from these screenshots. Earlier intermediate releases were superseded by the exact final revision above. The app release remains held.

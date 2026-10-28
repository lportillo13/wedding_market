# Submenu and mobile navigation styling

The owner requested a redesign focused on style rather than layout. The existing desktop search/category columns, mobile drawer, navigation destinations, account visibility rules and dialog controls remain in place. This website-only change continues the supplied GT Super / Acumin typography and the warm editorial direction. The app release remains held.

`styles/navigation-editorial.scss` gives the menus ivory surfaces, warm charcoal text, light serif headings, thin category dividers and restrained diagonal arrows instead of rounded category tiles. The search and action controls have consistent small corner radii; the account dropdown shares the same paper finish. The mobile drawer uses a clean ivory header, lighter category links, a quieter account panel and a dark footer action/language selection. The owner explicitly rejected `wm-header-botanical`; its decoration/component and unused styles are removed. Opening motion respects reduced-motion preferences. The homepage header, logo, hero and footer layout are unchanged.

## Verification

Local visual review covers desktop English/Spanish, a 390×844 phone and a 320×640 phone. The smallest dialog is 320px wide with a matching scroll width, 50px category targets, 16px search text and the footer ending at 640px. Escape closes the drawer, restores focus and unlocks body scrolling; opening through search focuses the input. Language changes keep the dialog open. Measurements are in [local-browser-checks.json](local-browser-checks.json).

The local content connection was unavailable and displayed the existing six-category fallback. The first live release confirmed all 19 managed categories, expansion from six to 19, 50px phone category targets, 44px language targets and no horizontal overflow at 320px. Live review also identified the shared legacy card skin overriding the account popup radius; local popup tokens now override that skin without affecting other cards. No data or business workflow was changed. Production build and TypeScript passed. Final live release verification is recorded below when complete.

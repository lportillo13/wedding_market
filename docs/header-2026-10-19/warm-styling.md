# Warmer wedding header and menu

The owner likes the new menu layout and requested warmer styling appropriate to weddings. This pass preserves the navigation structure, routes, account behavior and pinned controls.

The header and menus now use ivory/champagne surfaces, warm cocoa text, terracotta-brown actions, rounded category cards and serif details. A small decorative botanical SVG is hidden from assistive technology and cannot intercept input. The guest area resembles an invitation panel; signed-in client/vendor account sections retain their existing structure. Desktop search, suggestions, account controls and the vendor panel follow the same palette.

Long category names wrap naturally. At widths below 360 pixels, secondary card arrows are hidden to leave room for labels; the category links retain their full touch area. Search retains a 16-pixel input, phone controls retain at least 44-pixel targets, and existing reduced-motion behavior remains in place.

## Verification

- Web typecheck, ESLint, all 49 tests and the final production build passed, including the strengthened gold-tone contrast. The final route list contains no synthetic style-review page.
- Browser checks used the actual header with temporary synthetic guest/client/vendor props, including a long account name and long category labels. Checked English/Spanish, 320×568, 390×844, 844×390 and 1200×900 layouts, category expansion, scrolling, desktop discovery, route destinations, Escape/focus restoration and body scroll release.
- The narrow menu did not overflow horizontally. Checked buttons and category links were at least 44 pixels high. The landscape menu retained a 169-pixel scrolling body. The temporary route was removed before the production build; preview and viewport override were cleaned up.
- Calculated contrast: primary text on ivory 10.55:1; secondary text on the deeper blush surface 5.03:1; antique gold on blush 5.07:1; white text on the main action 6.18:1. The botanical motif and fine borders are decorative.
- No dependency, database, application workflow or native app changes were needed. Real sessions were not used for synthetic account checks; local Supabase remains offline.

Previews: [English](warm-menu-preview-en.png), [Spanish](warm-menu-preview-es.png). These are synthetic local previews. Live screenshots and the deployment receipt will be recorded after the gateway rollout completes.

## Release status

Prepared against verified live base `76a109e77368d11cc1554dd42bd806de9e288906`. Validation is complete; gateway deployment is pending. Do not treat the local preview as live.

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

Previews: [English](warm-menu-preview-en.png), [Spanish](warm-menu-preview-es.png). These are synthetic local previews. Verified production screenshots: [English phone menu](warm-menu-live-en.png), [Spanish phone menu](warm-menu-live-es.png), [Spanish desktop panel](warm-desktop-live-es.png).

## Release status

Deployed through the installed gateway as `0b952c4acf1fe2f5027cab106c642aef1cdca7a3`, from verified live base `76a109e77368d11cc1554dd42bd806de9e288906`. The detached service exited successfully; [the exact-commit receipt](warm-deployment-success.json) records successful shadow/live checks and rollback at `/var/www/wedding-market.before-20261019-214941`. The manifest SHA256 was `5aa98ee992b401ce52a8617f127e4831ebb0a109c78dac4d941e8c05aebca460`.

[Independent public verification](warm-public-release-checks.json) passed for health, homepage, vendor directory, bounded public results and anonymous protected API requests. Security headers remain installed and direct-origin HTTPS returns 403.

Live browser checks confirmed the new warm palette and decorative botanical, English/Spanish phone menus, all 19 categories, a 320-pixel menu without horizontal overflow, category targets at least 52 pixels high, Escape returning focus to the menu trigger and released body scrolling. The 1440-pixel Spanish desktop vendor panel was checked visually; English was restored after testing. Screenshots contain only public guest UI. The styling release does not publish a native binary or change database settings.

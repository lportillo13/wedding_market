# Transparent cover submenus

The owner requested and approved a visual preview of transparent submenus over the opening full-height vendor and boutique covers, switching to the existing solid ivory treatment after scrolling. The approved preview is `approved-preview.png`; it is a design reference, not a live screenshot.

A shared `HeroSectionNav` wrapper switches surfaces when the submenu reaches its sticky offset beneath the main header. Before that point it remains transparent over the image/video, with ivory labels and a champagne underline. Scrolling back into the cover restores transparency. Missing-image covers retain the solid surface. The mobile vendor More dropdown keeps its own solid ivory background and dark text.

Both layouts retain the opening-viewport geometry and 54px submenu height. The transition only changes colors/borders, so it does not shift content. Scroll and resize measurements are limited to one animation frame per event cycle, with resize observation and complete cleanup on unmount. Reduced-motion styles remove the color transitions. Existing navigation, focus handling, category labels, fitting actions and contact/account rules remain.

This is combined with the owner's revised **A — Editorial vendor identity** selection, documented in `../vendor-editorial-2026-10-29/README.md`. Native app publication remains held.

## Validation and release

`npm run check` passes architecture, TypeScript, lint and the production build. All 109 existing web tests pass. Local browser checks cover desktop opening geometry, vendor sticky/reverse transitions, 390px mobile More across both surfaces, Escape focus restoration, 320px boutique navigation and the fitting-view round trip. Both opening menus occupy the bottom 54px without horizontal overflow. The boutique desktop About anchor can stop 9px before the sticky threshold, correctly retaining the cover state until the submenu reaches the header. Browser errors were empty. Recorded measurements are in `local-browser-checks.json`.

Website release **ba689b190e62dd43ee02f196490c1a6c2712847e** is verified live. The [exact successful receipt](../vendor-editorial-2026-10-29/deployment-success.json) records rollback `/var/www/wedding-market.before-20261029-200102`; all 12 public checks pass. Live vendor desktop/phone and boutique desktop transitions, reverse scrolling and the solid mobile More dropdown are recorded in `live-browser-checks.json`. Boutique phone opening/reverse measurements are included; the phone PageDown observation stopped before the threshold, while local phone anchor checks confirm the solid sticky state. Actual opening/sticky screenshots for both types are in this folder.

The owner then requested centered vendor submenu labels and a full-width description. That follow-up is documented in [vendor alignment](../vendor-alignment-2026-10-29/README.md).

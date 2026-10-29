# Vendor hero viewport and media controls

The owner reported that a profile's submenu was below the opening viewport, the quote actions touched it, and video controls overlapped the site header. The reported example is `/vendors/example-ritmo-atardecer`; the photo example is `/vendors/example-luz-de-abril`.

## Cause and repair

Compressed Sass emitted UTF-8 byte-order markers. When Next merged stylesheets, an embedded marker became part of the first selector: `\uFEFF.wm-vendor-page.wm-profile-editorial`. That rule did not match the page, so `--profile-tabs-height` and the profile palette were absent. The hero's entire padding declaration, the submenu's negative margin, and bottom offsets for media controls consequently became invalid.

Sass now uses `charset: false`. A clean production rebuild has five CSS files and zero embedded byte-order markers. The existing 100svh hero, 54px submenu reservation and generous copy clearance now apply. The same encoding correction restores the intended first rules in the other Sass sheets; home/about/directory/boutique smoke checks are included.

The video playback control is a 44px circular translucent button at bottom-left. Gallery and provider links share a flex row at bottom-right, with consistent 44px targets, restrained borders, SVG icons and visible keyboard focus. Source links remain available while video playback is paused or reduced motion is enabled. Playback admission, muted autoplay, offscreen/background pausing, external destinations and contact/account restrictions are unchanged.

## Validation

- Architecture, TypeScript, ESLint and production build pass.
- A fresh build after clearing only the local regenerable webpack cache confirms no embedded BOM in any CSS file; see `css-build-check.json`.
- All 109 existing web tests pass. The cover rendering test now exercises VendorHeader because the external source link moved alongside the gallery link; its initial standalone-component expectation was updated after the first run found that ownership change.
- Production-preview geometry checked at 320×568, 390×844, 1280×720 and 1920×1080. The submenu bottom equals the viewport bottom at page opening. The vendor copy ends 112px above the submenu. Media targets are 44px and leave 16px above the submenu.
- Playback click and keyboard resume, gallery navigation, sticky submenu and EN/ES media-control labels checked. Home, about, sample directory and boutique cover smoke checks have no horizontal overflow.
- Native source/publication remains held. No database or infrastructure/security changes.

## Release

Prepared against verified website `694e808bf9de6280b2c4bfd783a8661da1c8dc02`. Publication and live proof will be recorded after the fixed gateway completes.

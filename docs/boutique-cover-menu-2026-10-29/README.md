# Boutique submenu at the opening viewport edge

The owner requested that dress/suit boutique pages show the submenu at the bottom of the opening hero, matching vendor profiles.

The boutique cover retains its 100vh/100svh minimum height. A shared 54px reservation now places the following sticky submenu over the final 54px of the cover, instead of adding it below the viewport. Hero copy has 80px clearance above the menu on desktop and 65px on phones. Top padding follows the actual header-height variable, allowing compact phone screens to fit the opening. The three existing navigation actions keep their destinations and remain sticky beneath the main header after scrolling.

This is a scoped stylesheet change. The selected A/B boutique identity, outfit details, account restrictions, fitting workflow, native app publication, database and infrastructure remain unchanged.

## Validation and release

Architecture, TypeScript, ESLint and production build pass. Production-preview checks at 1280×720, 390×844 and 320×568 confirm the submenu bottom equals the viewport bottom at page opening. Casa Marfil, Atelier Alba and the wrapped Sastrería Roble title fit; both EN/ES submenu labels fit at 320px without horizontal overflow. The submenu stays directly beneath the 68px mobile header after navigation. The fitting action still removes the cover/menu and opens the existing form; no request was submitted. See `local-browser-checks.json`; no console errors were recorded. The exact release receipt and live proof will be recorded after publication.


## Verified publication

Website **7d35a4214cd73e113a1290b49aeb975dfa8c38d8** is deployed against prior verified release `bd61f1246541f1979928f545497de24c05478b1a`. The fixed gateway receipt confirms this exact target and rollback `/var/www/wedding-market.before-20261029-173701`. All 13 public checks pass. Direct live phone/desktop geometry and sticky navigation checks, with no console errors, are in `live-browser-checks.json`; actual opening screenshots are `live-boutique-cover-desktop.jpg` and `live-boutique-cover-mobile.jpg`. Native publication remains held.

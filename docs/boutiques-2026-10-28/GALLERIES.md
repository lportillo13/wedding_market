# Expanded example collections and galleries

The owner requested more outfits in every boutique, multiple dress images and video previews. Each of the three fictional boutiques now has **six outfits**, for **18 outfits total**:

- Atelier Alba: four dresses and two suits, including crepe, organza, mikado and linen examples.
- Casa Marfil: six dresses, including ivory satin, floral lace, champagne, blush tulle and beaded designs.
- Sastrería Roble: six suits/tuxedos, including navy, charcoal, sand linen, black, forest green and light grey.

The featured Alba satin dress, Marfil lace dress, Marfil satin rental and Roble navy tuxedo each have **three distinct images and one video**. Rear and fabric-detail photos match the existing sample garments. The satin rental shares the same design imagery with Alba; the crepe and linen designs also appear with different purchase/rental offers across boutiques.

Web outfit detail now has a large image, a compact thumbnail selector, a photo/video counter, a video poster and standard inline playback controls. Changing back to a photo removes the video player. All media remains user-controlled, with no video preload before selection/playback. Native uses a matching image/thumbnail selector and its existing external video-player behavior. The supplied typography, warm styling, light photo headings, favorites and fitting workflow are preserved.

Sixteen additional images were created with the built-in image generation tool. Complete prompts, saved project paths and file hashes are in [expanded-gallery-assets.json](expanded-gallery-assets.json). Product-detail views use dressmaker/tailoring mannequins. Delivery JPEGs are at `public/boutique-examples/`; none of the assets are referenced only from the generation cache.

Three **11-second silent photo films** combine the front, back and detail views with crossfades. They demonstrate the video player; they are explicitly described as photo presentations rather than live garment-motion footage. The old sample URLs remain available for compatibility. New images and clips total approximately 3.53 MB; image and video selection remain inside the existing six-media-per-outfit limit. The native gallery imports only the existing Ionicons font, preserving the eight-asset bundle set.

This is still an explicit in-memory preview. There are no new database records, account seeds, migrations, uploads to vendor libraries, real fitting requests or notifications. Production catalogs and account transports remain separate. The original [example instructions](EXAMPLES.md) describe switching between couple/store roles.

Website architecture, types, lint, production build and **109 tests** pass. Existing preview regressions now also verify all 18 outfits, six items in every store, asset paths, three distinct photos on each featured outfit and the media limit. Native types/lint, Expo compatibility and **78 tests / 18 suites** pass; both Hermes exports contain eight font/icon assets. Native publication remains held. Screenshots and browser/release receipts alongside this file record the gallery review and subsequent deployment; no physical-device acceptance is claimed.

Publication is currently pending the administrator cache cleanup described in [the release handoff](GALLERY-RELEASE-PENDING.md). The existing live site has not been replaced by this expansion. The interactive local preview is open at `http://localhost:3014/boutiques/example-casa-marfil?outfit=e0130000-0000-4000-8000-000000000103`; its temporary server is intentionally left running while the owner completes the release prerequisite.

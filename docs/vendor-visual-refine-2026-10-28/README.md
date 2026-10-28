# Vendor cards, image-led hero and section navigation

The owner identified card text touching borders and an overly boxed card finish, then requested a photo-led profile hero with subtle boxed information, clearer section hover/active feedback and a filter that does not look clipped.

- Directory cards have explicit 20px horizontal content padding, no outer/footer outlines and lighter sample/category labels. Unnecessary initials-only logo boxes are removed; actual vendor logo artwork remains. Hover shadows and the old gold edge decoration are disabled.
- The profile hero uses one full-width cover photo or video. After reviewing the first ivory-panel version, the owner requested removal of that box. The final cover uses a light vendor name, compact location/rating and actions directly over a soft full-width gradient. Summary and experience/language/event details sit in About; other photos remain in the gallery. Existing gallery access and quote/save/share restrictions remain.
- Section tabs have a warm hover/active background and animated underline, respecting reduced motion. The active tab stays visible by scrolling only its horizontal navigation container.
- The search/filter spans the content width with inset controls, a separate padded button and visible overflow for focus/native controls. Fields use shrinkable grid tracks and stack on phones.
- The owner also requested new typography on About. Its headings, story lead, quotes, mission, journal and final invitation use GT Super Light; body copy uses regular Acumin and the opening accent uses Lucia. Warm shared colors and consistent button/photo corners replace the remaining heavier page-specific typography. Content and section animations are retained.
- At the owner's request, the large explanatory sample notice is removed from profile and directory pages so the actual design can be reviewed without an extra banner. Small directory sample labels, opt-in URLs, noindex and disabled inquiry submission remain.

## Photo or video cover

- Vendors choose Photo or Video in Profile → Media. Video can be selected from their existing uploaded profile clips or supplied as a public YouTube, Vimeo or direct HTTPS MP4/WebM URL. Library choices must belong to that vendor's current video assets. Existing upload processing, 50 MB admission limit and three-video quota are unchanged.
- Selection is stored in the existing `extra_info.hero_presentation`; `hero_image` remains the photo/poster so installed native clients continue displaying an image. Deleted/missing video selections fall back to the photo. No schema migration is needed.
- Direct clips loop silently with a pause/play control. Reduced motion disables automatic playback; clips pause offscreen or in background tabs. YouTube/Vimeo are click-to-load, use privacy-enhanced embeds and have an external source link. Provider embedding restrictions still apply. Supported parameters follow [YouTube's documentation](https://developers.google.com/youtube/player_parameters) and [Vimeo's player documentation](https://developer.vimeo.com/player/sdk/embed).
- `/vendors/example-ritmo-atardecer` demonstrates a YouTube cover using the same wedding film already embedded on the homepage; other examples demonstrate a single photo. The abstract legacy `wedding-demo.mp4` is not used in the final sample. Gallery photos remain available below the hero.
- Held native source accepts the optional video field and adds a Watch cover video action that opens the source in the device player/browser. It retains the photo poster; inline native playback is not added in this pass.

## Validation

Root architecture, types, lint and production build pass; 100 web tests pass, including URL normalization/rejection, owned-video selection, safe missing-asset fallback, preservation of unrelated settings and deferred third-party embeds. Native types/lint and 76 tests pass; Expo's offline dependency map reports versions current (online registry validation unavailable). No native cloud update, build, store upload or release was performed. No database records were created/edited for testing and sample inquiries remain disabled. Deployment and public browser evidence are recorded alongside this handoff after verification.

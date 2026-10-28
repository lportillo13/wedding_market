# Video control icons

The owner identified the vendor-cover pause control as looking like Roman numeral II. The cause was a font-dependent Unicode character inheriting the site's typography.

Play and pause now use filled geometric SVG paths in the existing shared icon component. The vendor button remains 44×44px with a centered 20px icon; the homepage uses the same icons for consistency. Existing bilingual labels, pressed state, autoplay and pause behavior remain intact. No native release or database change is part of this correction.

Verified live release: **85bd0ff8c53499fb3dd0089c8072850eb035b49a**, deployed over the already-live boutique release 93eaf870. The [gateway receipt](deployment-success.json) confirms this exact target. Architecture, types, lint, production build and 104 existing web tests pass.

[Browser checks](browser-checks.json) confirm the 44px vendor control contains a centered 20px SVG with no text glyph. Autoplay displays pause bars; tapping it removes the video frame and displays the play triangle; tapping again resumes playback. The homepage also renders the SVG pause bars. [Live phone screenshot](pause-control-mobile.jpg).

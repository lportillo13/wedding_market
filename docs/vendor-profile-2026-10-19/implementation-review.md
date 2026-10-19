# Public vendor profile redesign

The owner found the public vendor pages too simple and supplied the Golden Union 6 destination-planning profile as a reference. The shared public profile now extends the warmer wedding direction established in the header.

## What changed

- A split introduction pairs a large serif vendor name and useful facts with an arched cover photo, supporting images and the vendor's own logo. Profiles without photos use a monogram and a neutral invitation to start a conversation.
- The vendor story appears before the full gallery. Numbered section introductions, warm paper surfaces, service cards, amenity groups, package cards and team portraits give the content a clearer hierarchy.
- A desktop quote card stays beside the content. The phone action remains fixed at the bottom, with room reserved for it. The profile opts out of the site-wide main-element transform, which otherwise incorrectly contains fixed-position children.
- Section navigation measures the actual site header and tabs when scrolling, localizes its accessible name and respects reduced motion.
- The gallery uses a native modal dialog with focus trapping, Escape, previous/next keys, focus restoration and body-scroll cleanup. Thumbnail changes scroll only their rail, preserving the page's position.
- New interface copy is available in English and Spanish. Category-specific fields, vendor-authored content, review data, quote validation and role restrictions are preserved. Guest quote actions retain the login return URL; the new card does not display prices or contact data for guests. Vendor accounts retain their inbox action and do not receive client quote controls.

## Verification

TypeScript, ESLint, all 51 web tests and the final production build passed. Two added regressions cover guest price/contact privacy, bilingual sign-in copy, return destinations and authenticated quote-card pricing. The build contains no temporary preview route.

Browser review used the actual components with a copy of the supplied public demo page's anonymous data. Its guest status and null contact prefill were checked before copying. Temporary controls simulated client/vendor states and a sparse long-name profile; they did not use real sessions or submit forms. The preview route is removed before release.

Checked 1440×1000 desktop, 390×844 and 320×568 phones, and 844×390 landscape. Observed no page-width overflow, narrow review filters scroll within their own region, filter controls were at least 46 pixels high, and the phone quote bar aligned with the bottom of the viewport. Story navigation cleared both sticky bars. The gallery advanced its image counter, trapped Tab inside the dialog, restored focus to its trigger on Escape and released body scrolling. A synthetic client retained one optional budget and the calendar date input; vendor mode removed the contact section, quote card and phone quote bar. Sparse mode hid absent sections and showed its no-photo fallback.

Local Supabase is offline. Real signed-in saves, quote submission and native-device acceptance are not claimed. No database, dependency, uploaded-content or native-binary changes are included. Public sponsored placements remain disabled.

## Release status

Deployed through the installed gateway as `3254c5b2f336299e8f5543301b385cb695de2f1b`, from verified live base `0b952c4acf1fe2f5027cab106c642aef1cdca7a3`. The detached unit finished successfully. [The exact-commit receipt](deployment-success.json) records successful shadow/live probes and rollback at `/var/www/wedding-market.before-20261019-220621`. Manifest SHA256: `c5c318950f9a7bd85e2753176cc171e2df1d72fb975ab938f1bf5e1527d7584d`.

[Independent public checks](public-release-checks.json) passed for the supplied vendor page, directory, homepage, health and anonymous protected APIs. The new profile markup is present, security headers remain installed and direct-origin HTTPS returns 403.

Live visual inspection checked the English 1440-pixel desktop profile and quote card, plus the Spanish phone profile at 390 and 320 pixels. Neither phone width overflowed horizontally; the quote bar reached the viewport bottom. Section navigation cleared the two sticky bars. The Spanish photo dialog advanced its counter, trapped Tab, restored focus to its trigger on Escape and released body scrolling. English was restored after testing. Signed-in states remain synthetic-only verification as described above.

Live screenshots: [desktop introduction](live-desktop-en.png), [story and quote card](live-story-en.png), [Spanish phone introduction](live-mobile-es.png), [Spanish gallery](live-gallery-es.png). These show the existing public demo vendor's content, with no real-session customer data.

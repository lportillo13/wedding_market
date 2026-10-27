# Editorial website refresh — October 27, 2026

## Owner decisions

The owner authorized updating the normal live website and holding the app release. The FoundersCard reference supplies the desired spacious sections, motion and header-over-video presentation. Preserve Wedding Market's existing navigation and business flows.

The owner supplied GT Super + Lucia BT + Acumin Pro font archives, requested sitewide use and specified light weights. The invitation image is the visual reference: thin serif headings, delicate script accents and restrained body text. They rejected the first Lucia script logo; the revised website wordmark uses light uppercase GT Super and reads only Wedding Market in both languages. Lucia remains a selective content accent.

## Font provenance and evaluation status

Files came from the owner's `acumin-pro.zip`, `lucia-bt.zip` and `Grilli-Type-Trial-Fonts-2026-04.zip`. GT Super WOFF2 files are unchanged trial files from the supplied Web/GT-Super folder. Acumin and Lucia were converted to WOFF2 with their original metadata retained. The other two archives contained no license document. No purchase, subscription or claim of a final commercial font license is made.

The supplied Grilli trial EULA allows testing, trial use and pitches, and excludes final project files. This is the owner's requested temporary, non-final evaluation before deciding whether to buy the typography. A final typography rollout requires the appropriate publisher license. GT Super trial character coverage omits inverted Spanish punctuation; the configured serif fallback supplies those glyphs.

Public font assets live under `public/fonts/editorial`. GT Super Light is the display default, Acumin Regular is the body/control default, and Lucia is used for short editorial accents. Existing public profile and account font stacks now use the same families. Playfair Display and Google Sans are removed from the web style stacks and external stylesheet.

## Implementation

- Homepage navigation overlays the video inside the hero. A photograph remains available when the video is paused or reduced motion is preferred.
- Discovery has four deliberate controls, image transitions, keyboard navigation and functional destination links.
- Category, magazine, process, directory, blog, about and authentication surfaces share a quieter layout, thin dividers and fewer decorative boxes.
- Section entrances use staggered transitions, reveal focused content immediately and honor reduced motion.
- Existing account restrictions, bilingual behavior, disabled advertisements and empty real vendor directory are preserved. No fictional vendor was republished.
- No new native binary, store upload or app update is part of this release.

## Validation

TypeScript, ESLint, all 90 root tests and architecture checks passed. Desktop and 390/320px browser checks verified the light display type, body/control families, overlay header geometry, no horizontal overflow, video pause, mobile menu and discovery click/arrow-key behavior. Production build and live verification are recorded below when complete.

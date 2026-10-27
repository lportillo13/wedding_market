# Header controls and viewport hero — October 27, 2026

The owner requested smaller menu items, balanced button padding, a better language selector and a full-viewport hero with an interactive down arrow. Website deployment remains authorized; app release remains held.

Desktop navigation now uses 12.48px Acumin text. Header text buttons are centered, 44px high and have symmetric 16px horizontal padding. Icon controls share a consistent corner radius and sizing, including authenticated account/notification controls. The connected EN/ES switch replaces the isolated pills, with a clear selected state; the mobile menu uses the matching full language labels. Navigation destinations, authentication state and persisted language behavior are unchanged. Narrow mobile category text is smaller and the close control retains dark contrast inside the light menu.

The hero now starts at the top of the page and fills one viewport, using a 100vh fallback with stable small-viewport sizing on mobile. The existing header overlays the media. Video framing fills the hero, pause/poster behavior remains available and shorter phone screens receive tighter type/spacing. The centered down arrow is visible on desktop and mobile, has hover/focus feedback and a subtle motion cue, and smoothly scrolls to the next section. It transfers keyboard focus to that section, uses layout offsets unaffected by entrance transforms, and respects reduced motion. The anchor still targets the section when JavaScript is unavailable.

## Validation

- Local guest browser checks cover 1440×900, 390×844, 320×740 and 390×640. Hero heights match their 900/844/740/640px viewports, checked pages have no horizontal overflow, and the arrow remains inside the hero below its content.
- Visible header language/quote/login controls measure 44px high; quote/login padding is 16px on both sides. The closed mobile dialog's hidden CTA is excluded from these visible-control measurements.
- EN/ES switching, mobile menu open/close and the scroll action were exercised. The phone arrow lands at scrollY844 with the next section at top0 and keyboard focus on benefits. No account, newsletter or consent write was performed.
- TypeScript, ESLint, all 90 root tests and the production build passed.

[Guest desktop view](header-hero-guest-desktop.png) and [local measurements](header-hero-local-checks.json) document the inspected implementation. No temporary route, database change or native source/release is included.

## Verified live release

Website commit **41ddaa22faf424a6dc039997602bc22de5f1bae2** is live with its successful [exact gateway receipt](header-hero-deployment-success.json). Rollback is `/var/www/wedding-market.before-20261027-223941`. Existing health and anonymous authorization probes pass. [Public EN/ES checks](header-hero-public-checks.json) confirm the scroll target, served header/viewport styles, preserved footer/support identity and compact onboarding footer.

[Live browser measurements](header-hero-live-checks.json) verify a 900px desktop hero in a 900px viewport, a 844px phone hero in a 844px viewport, smaller 12.48px navigation, aligned authenticated controls with 44px heights/7px radii, and no horizontal overflow at 1425/375px content widths. The live arrow reaches scrollY900, target top0 and focus on benefits. The 48px phone arrow is fully visible at y780–828 within the 844px viewport. See the [public-only live phone screenshot](live-header-hero-phone.png). Video playback was restored after the capture. No consent, subscription or account write occurred during verification; the app release stays held.

## Caption centering correction

The owner identified that Celebra en Costa Rica was offset above the centered headline. Its inherited maximum width combined with zero side margins had left the paragraph off-center. Restoring automatic inline margins fixes both languages without changing the layout or typography.

CSS-only website release **cc866eae2d0a9f9f9b06483bd29b4ef4874b90a6** is verified by its [exact receipt](caption-center-deployment-success.json), [bilingual public checks](caption-center-public-checks.json) and [browser measurements](caption-center-browser-checks.json). Rollback is `/var/www/wedding-market.before-20261027-224815`. The caption and headline centers both measure 712.5px on desktop and 187.5px on phone, with zero difference. Production build/TypeScript passed. [Centered live detail](live-caption-centered.png) contains only the public hero content. The temporary verification tab was closed; language and viewport were restored. No native release changed.

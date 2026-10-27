# Header controls and viewport hero — October 27, 2026

The owner requested smaller menu items, balanced button padding, a better language selector and a full-viewport hero with an interactive down arrow. Website deployment remains authorized; app release remains held.

Desktop navigation now uses 12.48px Acumin text. Header text buttons are centered, 44px high and have symmetric 16px horizontal padding. Icon controls share a consistent corner radius and sizing, including authenticated account/notification controls. The connected EN/ES switch replaces the isolated pills, with a clear selected state; the mobile menu uses the matching full language labels. Navigation destinations, authentication state and persisted language behavior are unchanged. Narrow mobile category text is smaller and the close control retains dark contrast inside the light menu.

The hero now starts at the top of the page and fills one viewport, using a 100vh fallback with stable small-viewport sizing on mobile. The existing header overlays the media. Video framing fills the hero, pause/poster behavior remains available and shorter phone screens receive tighter type/spacing. The centered down arrow is visible on desktop and mobile, has hover/focus feedback and a subtle motion cue, and smoothly scrolls to the next section. It transfers keyboard focus to that section, uses layout offsets unaffected by entrance transforms, and respects reduced motion. The anchor still targets the section when JavaScript is unavailable.

## Validation

- Local guest browser checks cover 1440×900, 390×844, 320×740 and 390×640. Hero heights match their 900/844/740/640px viewports, checked pages have no horizontal overflow, and the arrow remains inside the hero below its content.
- Visible header language/quote/login controls measure 44px high; quote/login padding is 16px on both sides. The closed mobile dialog's hidden CTA is excluded from these visible-control measurements.
- EN/ES switching, mobile menu open/close and the scroll action were exercised. The phone arrow lands at scrollY844 with the next section at top0 and keyboard focus on benefits. No account, newsletter or consent write was performed.
- TypeScript, ESLint, all90 root tests and the production build passed. The live result is recorded after deployment.

[Guest desktop view](header-hero-guest-desktop.png) and [local measurements](header-hero-local-checks.json) document the inspected implementation. No temporary route, database change or native source/release is included.

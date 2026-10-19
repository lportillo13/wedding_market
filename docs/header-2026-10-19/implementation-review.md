# Website header and mobile navigation — October 19, 2026

The owner requested a better mobile menu and header. This batch updates the responsive website; it does not change the native Expo navigation. The website and earlier code/profile UX batches were subsequently deployed successfully as `2f0a556d`, followed by assistant-operated release `76a109e7`. See [the verified deployment receipt](deployment.md); native app binaries have not been republished.

## Behavior

- One sticky header now serves the homepage and interior pages. The duplicate homepage navigation and authentication observer were removed. The wordmark, Costa Rica tagline, search and menu controls share the same placement on phones.
- The phone menu is a native modal dialog with its own scrolling body, a persistent close button and a pinned action/language area. It provides direct category, shortlist, account and vendor registration links. Larger category lists can expand without moving the close button off screen.
- Couples retain their unified client inbox; vendors receive their own inbox, dashboard, profile and notification destinations. A loading state avoids showing a client quote action while the account role is unresolved.
- English and Spanish controls remain directly available. Phone controls have larger touch targets, safe-area spacing, reduced-motion support and a 16-pixel search field to avoid iOS focus zoom.
- Desktop navigation has a click-operated vendor panel, bounded scrolling and keyboard search. Enter searches the directory even when suggestions are unavailable. Escape closes vendor/account panels and restores trigger focus. Account menus also close after route changes.
- Shared icons, language controls, role destinations and sign-out feedback replace duplicated behavior. Sign-out keeps the existing browser/server sequence and adds visible failure feedback. Sticky public-profile tabs are offset below the new header.

## Validation

- Production build, standalone TypeScript check, ESLint and all 49 web tests passed. Three navigation regressions cover role destinations, unified inboxes and route-boundary matching.
- Browser checks covered English/Spanish guest menus, synthetic client/vendor accounts with a long name, the account loading state, category expansion, scrolling, Escape/focus restoration, desktop account/vendor panels and closing the phone menu when entering the desktop layout.
- Checked 320×568, 390×844, 844×390, 1200×900 and 1440×900 viewports. The menu fit the viewport; the landscape dialog retained a scrollable content area and accessible footer. Mobile search submitted `photography` to `/vendors?q=photography`, and the directory retained the term.
- The temporary synthetic review route was removed before the production build. The preview server was stopped and the browser viewport override reset. Dependencies and database schema were unchanged.

The local Supabase endpoint is offline. Real signed-in sessions, notification delivery, vendor suggestion results and successful sign-out still need an account-backed acceptance pass. Account navigation was checked using synthetic props, and search routing was verified against the real directory's unavailable-data state. These browser viewport checks do not replace testing on a physical phone.

## Previews

- [Phone header on the homepage, Spanish](mobile-header-es.png)
- [Phone menu, English](mobile-menu-en.png)
- [Phone menu, Spanish](mobile-menu-es.png)
- [Vendor account menu, synthetic Spanish account](vendor-menu-es.png)
- [Desktop header, English](desktop-header-en.png)
- [Desktop vendor navigation, English](desktop-vendors-en.png)

The initial UX implementation made no production content writes. The later website rollout is recorded in the deployment receipt. No native app release was performed.

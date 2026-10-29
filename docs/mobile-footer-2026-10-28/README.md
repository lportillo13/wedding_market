# Closed mobile footer menus

The owner requested a shorter phone footer with menus closed by default. The public footer now has three full-width disclosure rows below 768px: Explore, For your wedding and Wedding professionals. Each starts closed, opens independently with a tap or keyboard, exposes its expanded state and controlled panel, and resets when the page pathname changes. Desktop retains visible headings and all links. The legal links stay directly accessible.

The existing newsletter handling, category destinations and compact account/workspace footer are preserved. No newsletter form was submitted during verification. The only animation added is the chevron rotation, with reduced-motion support. No native application or database changes are included.

## Validation

Architecture, TypeScript, ESLint and the production build pass. Browser checks verify all three menus closed at 320/390px, 52px heading targets, 44px expanded links, independent opening, keyboard activation, closing after About → Vendors navigation, desktop/tablet visibility, and English/Spanish labels without horizontal overflow. At 390px, the collapsed footer measures about 777px and the complete footer fits below the sticky header in the 844px preview. [Phone preview](collapsed-footer-mobile.jpg) and [browser evidence](browser-checks.json) record the local result; the browser console reported no errors.

## Publication status

**Published October 29, 2026 UTC at 6f7c0b5412049a9d284b75b69f93328c56991b8e**, together with the profile More submenu. The exact [successful receipt](deployment-success.json) confirms shadow/live checks and rollback `/var/www/wedding-market.before-20261029-010445`. [Live browser checks](live-browser-checks.json) verify closed phone menus, independent expansion, full desktop links, fitted profile labels, section selection, Escape and English/Spanish behavior. The [live phone capture](live-collapsed-footer-mobile.jpg) shows the published footer.

The owner completed server cleanup. Read-only verification found 64,163,590,144 bytes available before deployment and 62,018,899,968 after it, clearing the previous disk-space blocker without lowering the 6 GiB reserve. This task did not delete server or backup directories or change privileged helpers. No further cleanup action is requested for this completed release. Native publication remains held.

The isolated `.cache/mobile-footer/release` payload was published over verified base 62c21d18. Its manifest SHA-256 is `57f01724be28fed61309938f9c54af62807a84510bd227c63fff00b2c2e49469`. Earlier prepared manifests are superseded; future releases must use the newly verified live base.

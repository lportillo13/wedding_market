# Closed mobile footer menus

The owner requested a shorter phone footer with menus closed by default. The public footer now has three full-width disclosure rows below 768px: Explore, For your wedding and Wedding professionals. Each starts closed, opens independently with a tap or keyboard, exposes its expanded state and controlled panel, and resets when the page pathname changes. Desktop retains visible headings and all links. The legal links stay directly accessible.

The existing newsletter handling, category destinations and compact account/workspace footer are preserved. No newsletter form was submitted during verification. The only animation added is the chevron rotation, with reduced-motion support. No native application or database changes are included.

## Validation

Architecture, TypeScript, ESLint and the production build pass. Browser checks verify all three menus closed at 320/390px, 52px heading targets, 44px expanded links, independent opening, keyboard activation, closing after About → Vendors navigation, desktop/tablet visibility, and English/Spanish labels without horizontal overflow. At 390px, the collapsed footer measures about 777px and the complete footer fits below the sticky header in the 844px preview. [Phone preview](collapsed-footer-mobile.jpg) and [browser evidence](browser-checks.json) record the local result; the browser console reported no errors.

## Publication status

**This footer change is ready locally, not live.** The successful website receipt remains **62c21d1810428720bef913339a837746932b2c15**, which includes the earlier calendar/gallery/filter corrections and boutique expansion. The profile More submenu and these footer disclosures are the next pending website changes.

The latest read-only check found 4,467,671,040 bytes available, below the unchanged deployment helper reserve of 6,442,450,944 bytes. No new job was launched, reserve weakened, privileged helper changed, or server/backup directory deleted. Additional server build space is needed before another release. Keep native publication held.

An isolated candidate can be prepared under ignored `.cache/mobile-footer/release` against live base 62c21d18. Recheck current live state and free space before publishing. The earlier `.cache/profile-submenu/release` payload contains only the More-menu candidate; it does not include this footer change.

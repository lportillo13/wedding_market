# Boutique directory design options

The owner requested three visual options before changing `/boutiques?examples=1`, then selected **A — Atelier editorial**. These built-in imagegen concept boards show desktop and mobile in each image. Full preview prompts are in `prompts.json`.

- **A — Atelier editorial** (`option-a.png`): split editorial introduction, underlined controls and richer immersive photo cards with company identity. Recommended to add character while keeping the directory easy to scan.
- **B — Cinematic opening** (`option-b.png`): fashion-led photo opening followed by compact filters and boutique cards.
- **C — Boutique stories** (`option-c.png`): horizontal photo/identity stories on desktop, stacked on phones.

The photos and sample marks in the boards are illustrative. The implementation retains the established Wedding Market header/navigation, supplied fonts, example-data isolation, actual vendor logos or contained initials fallback, and saved/fitting actions. No font purchase or native publication is included.

## Selected implementation

The directory now has a split light-serif introduction and editorial dress/suit photograph, fine underlined collection filters, a static Costa Rica location label and immersive cards with company identity. The first column is slightly wider; phones use one column. Each card remains one accessible link to its existing storefront. The directory omits the redundant link back to itself while retaining saved outfits and fitting appointments. Filter changes reset the page; clicking the current filter retains the result list. Existing outfit grids and boutique/store details keep their own presentation.

The new [editorial image](../../public/images/boutique-directory-atelier.webp) was made with built-in imagegen, then optimized to a 1200×800 WebP (117,526 bytes). Its exact prompt is in `hero-prompt.txt`; the original generated PNG remains under the Codex generated-images folder. It depicts garments without representing a named vendor or asserting stock availability.

Migration `202610290014_boutique_directory_filters.sql` adds only a published-item existence filter to the existing directory projection before its fixed 12-row pagination. It preserves the storefront branch, private price/contact masking, function grants and empty search path. No new tables, grants or cache are added. The isolated example transport follows the same filtering rule. The verified WedMarket project applied migration 014 after the prior ledger/function checks; exact migration-source checksum, live receipt and normalized function-body verification are archived here. UI formatting changes function-body whitespace, so the raw body hash differs; the normalized body matches reviewed source. The migration ledger stores the exact LF-normalized source. A subsequent read-only verification initially hit an editor selection syntax error and succeeded after clearing the editor; it did not reapply the migration.

## Validation and publication

Architecture, TypeScript, lint and final production build pass. All 110 web tests and 48 database tests pass; disposable migration replay/inspection passes. The new regressions cover collection filtering, drafts/disabled boutiques and unchanged directory privacy. Production-preview browser checks cover 320px/390px and desktop, loaded imagery, GT Super typography, both languages, correct suit/dress subsets, clicking the active filter, saved-outfit navigation and opening the existing storefront/transparent submenu. No horizontal overflow or browser errors occurred. See `local-browser-checks.json`.

Website **8e64979ffb1cf1796b356f02db2bf57b9f7f984e** is deployed against verified base `30376b0984d2f679d874081abad13c6aac6dcf4a`. `deployment-success.json` confirms the exact successful target and rollback `/var/www/wedding-market.before-20261029-203801`. All **18 public checks** pass, including both directory pages, the optimized image, both public type-filter endpoints and invalid-filter rejection. Direct live desktop, 390px and 320px checks confirm images load, correct filter results, retained active-filter results and no overflow/errors; see `live-browser-checks.json`. Actual screenshots are `live-desktop.jpg` and `live-mobile.jpg`. Native release remains held.

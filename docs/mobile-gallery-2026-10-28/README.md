# Phone gallery thumbnail visibility repair

The owner reported blank thumbnail boxes below the main photo on the Villa Brisa profile. Live phone inspection reproduced the problem: each thumbnail button had a real 98 × 74px box, while its image wrapper computed to `display: none` and zero dimensions.

An obsolete mobile rule in `app/globals.css` hides every direct `span` inside a gallery thumbnail button. The current component uses that span for its image wrapper, not a text caption. The repair removes that rule and the unused caption typography rules in the global/profile styles. Image URLs, lazy loading, media access and gallery behavior are unchanged.

## Verification

- Architecture, TypeScript, ESLint and the production build pass.
- At 390px, all three wrappers are visible at approximately 94 × 70px, and the screenshot shows their actual photos. At 320px they remain visible at approximately 75 × 55px. Desktop 1150px retains its visible 80 × 76px thumbnails. There is no horizontal page overflow at any of these widths.
- Selecting thumbnail 2 activates photo 2 and its pressed state. Next selects photo 3; previous returns to photo 2.
- [Fixed phone preview](fixed-mobile-preview.jpg) is a local browser capture, **not a published-site claim**.

## Publication status

The verified website remains **3c74fd44298b0ea85069a0d500d4f14f58ea6d84**, which still has this image-hiding rule. The source repair is ready but publication is blocked by the same deployment disk-space precondition as the pending directory category-reset correction: 6,264,713,216 bytes available versus the fixed 6 GiB minimum of 6,442,450,944 bytes. No new release was launched into this known failure, and no storage threshold or access rule was bypassed.

The owner was already asked to start the installed `wedding-market-retention.service` from the server root terminal. Its timer is enabled and preserves the active site and verified rollback. After cleanup, verify the current live revision and concurrent boutique release state before preparing/publishing the latest reviewed source. No release/backup directory was deleted, and the native release remains held.

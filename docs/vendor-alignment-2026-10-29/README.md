# Vendor menu alignment and full-width description

The owner requested vendor submenu labels centered like the boutique menu and the description spanning 100% of the available content width. The navigation uses the centered flex utility; the More control participates in that same group rather than consuming an automatic left margin. The summary/story container uses width 100% without its previous 54rem cap. The A logo/heading identity remains left aligned.

Transparent opening and solid sticky surfaces, full-height cover geometry, overflow sizing, keyboard handling and existing vendor actions remain. This is a small presentation follow-up to `ba689b190e62dd43ee02f196490c1a6c2712847e`. Native publication remains held.

## Validation and release

Architecture, TypeScript and lint pass. The initial restricted build could not create one generated output directory (EPERM); the unchanged build passed when repeated with the required filesystem access. Local production-preview measurements at 1440px, 390px and 320px confirm the label group's center matches the page center within 0.01px, in cover and sticky states. Description and both paragraph widths equal their parent (1132px, 351px and 281px respectively), with no cap or horizontal overflow. More opens and Escape closes it. No browser errors were recorded. See `local-browser-checks.json`.

Website **30376b0984d2f679d874081abad13c6aac6dcf4a** is published, with an exact successful receipt in `deployment-success.json`, rollback `/var/www/wedding-market.before-20261029-201359`, and all 12 public checks passing. The following boutique-directory release retains these changes; final live browser evidence will be saved here after that release.

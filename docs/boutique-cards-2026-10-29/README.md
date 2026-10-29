# Outfit cards match vendor listings

The owner supplied an outfit-card screenshot and requested the same style as the vendor directory. Outfit cards now reuse the approved directory-B card rules: full-photo cards, bottom gradient, ivory light-serif names, Lucia categories, compact metadata, arrow actions and dark circular favorite controls. Desktop images use 3:5 proportions, with square cards and one column on phones, following the existing vendor grid. Store collections and saved outfits use the same new `OutfitCard` view.

The shared card styling is scoped to the vendor directory and the outfit grid. Vendor-only search/filter rules stay scoped to the vendor directory. Outfit type, designer, purchase/rental terms and price remain visible; full information and all media remain in the detail gallery. Existing favorites, outfit deep links, form behavior, example-session isolation and resource bounds remain. The previously removed example panel stays absent from boutique browsing.

Architecture check, TypeScript, lint, production build and all 109 web tests pass. Browser checks cover six cards, favorite state and filled hearts, keyboard arrow activation, four-media gallery opening, saved-card reuse and deep links. Spanish phone layouts at 390px and 320px fit all captions without document overflow; English category/offer/currency labels also pass. Direct comparison with the existing vendor directory confirms matching 3:5 media, 10px corners, 24px desktop/20px phone caption padding, GT Super 300 ivory titles and the same gradient. See `local-browser-checks.json`. Temporary viewport/language changes were restored.

Live release evidence will be recorded after completion.

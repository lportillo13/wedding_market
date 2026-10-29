# Boutique cover header

The owner requested the same transparent navigation over the boutique photo as on vendor profiles. Boutique storefront covers now reuse the vendor header rules, including ivory navigation controls and the warm brown surface after scrolling. The photo starts at the top and fills the viewport. The cover gradient matches vendor profiles for readable navigation.

The example controls sit below the cover, with a clear fictional-boutique label on the cover itself. The directory, favorites, outfit details and appointment form keep their normal paper header. Missing stores and stores without a cover cannot trigger the overlay. The example transport and existing role/session state remain shared across navigation.

Validation: architecture check, TypeScript, ESLint, production build and all 109 web tests pass. Local browser checks cover desktop, 390px and 320px phones, transparent/scroll states, the mobile menu, normal detail/form headers, directory, saved-outfit persistence across navigation and the existing vendor profile cover. See `local-browser-checks.json`. No database, native app or publication workflow changes were required.

Website release **3eba6d360e40766e363e23dc97a398168c7ff546** is verified live through the fixed gateway's exact-target successful receipt, all 49 public checks and direct desktop/phone browser checks. Rollback is `/var/www/wedding-market.before-20261029-140002`. See `deployment-success.json`, `public-checks.json`, `live-browser-checks.json` and the public-only `live-phone.jpg` capture. The temporary localhost:3024 preview is stopped and the browser viewport override is reset. Native publication remains held.

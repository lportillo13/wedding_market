# Boutique cover header

The owner requested the same transparent navigation over the boutique photo as on vendor profiles. Boutique storefront covers now reuse the vendor header rules, including ivory navigation controls and the warm brown surface after scrolling. The photo starts at the top and fills the viewport. The cover gradient matches vendor profiles for readable navigation.

The example controls sit below the cover, with a clear fictional-boutique label on the cover itself. The directory, favorites, outfit details and appointment form keep their normal paper header. Missing stores and stores without a cover cannot trigger the overlay. The example transport and existing role/session state remain shared across navigation.

Validation: architecture check, TypeScript, ESLint, production build and all 109 web tests pass. Local browser checks cover desktop, 390px and 320px phones, transparent/scroll states, the mobile menu, normal detail/form headers, directory, saved-outfit persistence across navigation and the existing vendor profile cover. See `local-browser-checks.json`. No database, native app or publication workflow changes were required.

Deployment and public verification will be recorded here after the exact target release succeeds.

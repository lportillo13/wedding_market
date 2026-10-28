# Vendor pages aligned with the site

The owner reviewed the sample photography profile and requested consistent styling across vendor pages. This update changes the maintained directory/profile styles, so real vendor profiles inherit the same finish when published.

- Public profiles now inherit the site's ivory, warm ink, champagne, muted text and divider tokens. GT Super headings use Light (300), Acumin copy/controls use Regular (400), and decorative star flourishes are removed.
- Photo frames and the quote sidebar use restrained 10px corners. Buttons, inputs, gallery controls and directory search share 7px control corners, balanced padding and readable labels. Vendor logos retain their actual artwork in a neutral frame.
- Profile sections use fine dividers rather than nested rounded panels. Pricing, service and team cards share paper surfaces and thin borders. The inquiry form remains a distinct, readable panel; empty contact-detail boxes are omitted.
- Section navigation uses an underline and stays beneath the site header. Phone actions preserve a readable vendor name and wrapping action text. Calendars retain their available/busy semantics while matching the lighter type and surfaces.
- Gallery controls, review filters, rating summary and distribution bars use the same typography and warm palette. Directory cards share the profile surface finish.

Existing category-specific fields, pricing/contact access gates, real inquiries, saved-vendor behavior and gallery/review interactions are preserved. Sample labels and disabled sending remain enforced. No database change, account write or native app release is part of this visual pass.

## Verified release and review

Website **2b2524efd0d94f8416e64f85aee1afb4fd635cb7** is live. [The exact gateway receipt](deployment-success.json) confirms a successful switch and rollback at `/var/www/wedding-market.before-20261028-164802`. The earlier `f54d141565b1e59d810b6db296bb6f2c59764677` pass is superseded by the final scoped correction for legacy input properties marked important.

Architecture/type/lint, all **94 web tests** and the final production build pass. [Public checks](public-checks.json) pass 19 bilingual page/filter/API cases. [Browser measurements](browser-checks.json) confirm 300-weight titles, 400-weight controls, symmetric button padding, 7px inputs/buttons, 16px input text, 10px photo corners, disabled sample sending and no document overflow at desktop, 390px and 320px. Gallery open/Escape, five-star filtering and sticky section navigation work; the Pricing section clears the tabs by about 21px. Spanish content was checked after reloading the selected language. English and the normal viewport were restored afterward.

Public-only captures: [wide profile](live-wide-profile.jpg), [phone profile](live-phone-profile.jpg), [320px Spanish inquiry form](live-narrow-contact-es.jpg). Account identity is excluded. No customer information was entered or submitted. Native source was not changed by this styling pass; **the app release remains held**.

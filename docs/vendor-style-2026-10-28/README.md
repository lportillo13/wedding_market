# Vendor pages aligned with the site

The owner reviewed the sample photography profile and requested consistent styling across vendor pages. This update changes the maintained directory/profile styles, so real vendor profiles inherit the same finish when published.

- Public profiles now inherit the site's ivory, warm ink, champagne, muted text and divider tokens. GT Super headings use Light (300), Acumin copy/controls use Regular (400), and decorative star flourishes are removed.
- Photo frames and the quote sidebar use restrained 10px corners. Buttons, inputs, gallery controls and directory search share 7px control corners, balanced padding and readable labels. Vendor logos retain their actual artwork in a neutral frame.
- Profile sections use fine dividers rather than nested rounded panels. Pricing, service and team cards share paper surfaces and thin borders. The inquiry form remains a distinct, readable panel; empty contact-detail boxes are omitted.
- Section navigation uses an underline and stays beneath the site header. Phone actions preserve a readable vendor name and wrapping action text. Calendars retain their available/busy semantics while matching the lighter type and surfaces.
- Gallery controls, review filters, rating summary and distribution bars use the same typography and warm palette. Directory cards share the profile surface finish.

Existing category-specific fields, pricing/contact access gates, real inquiries, saved-vendor behavior and gallery/review interactions are preserved. Sample labels and disabled sending remain enforced. No database change, account write or native app release is part of this visual pass.

The production build, architecture/type/lint checks and existing application regression tests are run before deployment. Final live evidence is recorded alongside this handoff. The app release remains held.

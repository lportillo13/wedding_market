# Vendor introduction page

The owner requested a dedicated page explaining why wedding professionals should join, using the feel and animation of [FoundersCard Network](https://founderscard.com/network) as a reference. The new public route is `/for-vendors`.

The page adapts that pacing to Wedding Market: a full-height photographic opening with slow motion, large serif and italic headings, photographic benefit panels, scroll reveals, four selectable product illustrations, a photographic interlude, six practical feature summaries, onboarding steps, FAQs and a final signup invitation. It uses existing brand fonts and warm ivory, champagne and brown surfaces. Reference branding, assets and claims were not copied.

English and Spanish follow the existing persistent language controls. All join buttons lead to the existing `/signup/vendor` flow. Existing mobile vendor navigation, the public footer and the directory's empty-state invitation lead to this introduction. The approved navigation structure is retained. The page lives outside protected `/vendor` routes.

The product story covers business identity/photos/gallery/team, category-specific services and prices, availability, private inquiries, questions before proposals, revisions, independent vendor booking and contact consent, grouped studio editing, private draft preview, reviews, notification preferences, phone access and both languages. Examples are explicitly illustrative and contain no real customer data. Free launch accounts and direct vendor contracts/payments are stated; there are no invented testimonials, member counts or booking guarantees.

Motion has a pause control and respects reduced-motion preferences. Content remains visible without JavaScript; focus reveals pending content, feature tabs support arrow/Home/End navigation, and FAQ disclosures use native details/summary. The global reveal controller skips this page so whole sections never become transformed scroll containers. The page adds no database query, polling, analytics or animation dependency.

## Validation

- Architecture, TypeScript, ESLint and production build pass under Node 24.19.0 in an isolated snapshot of baseline `4f1ea631` plus the exact page changes, avoiding unrelated concurrent working changes.
- All 159 existing web tests and all 15 local production HTTP checks pass. No database structure changed.
- All four product previews in both languages at 320, 390 and 1440 viewport widths; narrow Spanish preview clipping was corrected during QA.
- Keyboard tab selection, FAQ expansion, persistent Spanish after reload, pause control and loaded images checked in the browser. Reduced-motion CSS and media-query handling are present; no operating-system motion preference was changed.
- No business publication, account signup, profile save, message, proposal, consent acceptance or customer write was submitted during QA. Native source and store releases are outside this website change.

## Verified release

Website commit **d969a533ad79a6af6c7b1202faa0b46502757938** is deployed through the fixed gateway. The successful [exact-commit receipt](deployment-success.json) includes passing shadow/live probes and rollback `/var/www/wedding-market.before-20261030-192001`.

All 15 [public HTTP checks](public-checks.json) pass: EN/ES page content, existing homepage/vendor entry points, delivered CSS/motion rules, private account-aware HTML and protected API responses. All 24 [production layout checks](local-interaction-checks.json) pass for the four previews in both languages at 320, 390 and 1440 viewport widths, with no horizontal overflow or clipped preview content. [Local HTTP results](local-http-checks.json) also pass.

The live browser verified the English desktop and Spanish phone hero, loaded images, pause control, focused section navigation and the Spanish inquiry preview. Captures: [desktop](live-desktop.jpg), [phone](live-phone-es.jpg). The existing QA session's terms notice was minimized for viewing; its acceptance checkbox remained false and no consent was submitted. Language was restored to Spanish. Temporary viewport overrides and owned local servers are cleaned up after verification.

The release preserves the preceding social onboarding and approved Google proof file. Native source/store releases, database data, authentication, vendor publication and DW were not changed by this page. Later documentation-only commits do not imply a new application deployment.

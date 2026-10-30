# Vendor introduction page

The owner requested a dedicated page explaining why wedding professionals should join, using the feel and animation of [FoundersCard Network](https://founderscard.com/network) as a reference. The new public route is `/for-vendors`.

The page adapts that pacing to Wedding Market: a full-height photographic opening with slow motion, large serif and italic headings, photographic benefit panels, scroll reveals, four selectable product illustrations, a photographic interlude, six practical feature summaries, onboarding steps, FAQs and a final signup invitation. It uses existing brand fonts and warm ivory, champagne and brown surfaces. Reference branding, assets and claims were not copied.

English and Spanish follow the existing persistent language controls. All join buttons lead to the existing `/signup/vendor` flow. Existing mobile vendor navigation, the public footer and the directory's empty-state invitation lead to this introduction. The approved navigation structure is retained. The page lives outside protected `/vendor` routes.

The product story covers business identity/photos/gallery/team, category-specific services and prices, availability, private inquiries, questions before proposals, revisions, independent vendor booking and contact consent, grouped studio editing, private draft preview, reviews, notification preferences, phone access and both languages. Examples are explicitly illustrative and contain no real customer data. Free launch accounts and direct vendor contracts/payments are stated; there are no invented testimonials, member counts or booking guarantees.

Motion has a pause control and respects reduced-motion preferences. Content remains visible without JavaScript; focus reveals pending content, feature tabs support arrow/Home/End navigation, and FAQ disclosures use native details/summary. The global reveal controller skips this page so whole sections never become transformed scroll containers. The page adds no database query, polling, analytics or animation dependency.

## Validation

- Architecture, TypeScript, ESLint and production build in an isolated snapshot, to avoid unrelated concurrent working changes.
- Existing web regression suite and bilingual production HTTP checks.
- All four product previews in both languages at 320, 390 and 1440 viewport widths; narrow Spanish preview clipping was corrected during QA.
- Keyboard tab selection, FAQ expansion, persistent Spanish after reload, pause control and loaded images checked in the browser. Reduced-motion CSS and media-query handling are present; no operating-system motion preference was changed.
- No business publication, account signup, profile save, message, proposal, consent acceptance or customer write was submitted during QA. Native source and store releases are outside this website change.

Final release receipt and public verification will be recorded after deployment. See `local-interaction-checks.json` and `local-http-checks.json` for the collected checks.

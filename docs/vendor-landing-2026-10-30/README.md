# Vendor introduction page

The owner requested a dedicated page explaining why wedding professionals should join, using the feel and animation of [FoundersCard Network](https://founderscard.com/network) as a reference. The new public route is `/for-vendors`.

The page adapts that pacing to Wedding Market: a full-height photographic opening with slow motion, large serif and italic headings, photographic benefit panels, scroll reveals, four selectable product illustrations, a photographic interlude, six practical feature summaries, onboarding steps, FAQs and a final signup invitation. It uses existing brand fonts and warm ivory, champagne and brown surfaces. Reference branding, assets and claims were not copied.

English and Spanish follow the existing persistent language controls. All join buttons lead to the existing `/signup/vendor` flow. Existing mobile vendor navigation, the public footer and the directory's empty-state invitation lead to this introduction. The approved navigation structure is retained. The page lives outside protected `/vendor` routes.

The product story covers business identity/photos/gallery/team, category-specific services and prices, availability, private inquiries, questions before proposals, revisions, independent vendor booking and contact consent, grouped studio editing, private draft preview, reviews, notification preferences, phone access and both languages. Examples are explicitly illustrative and contain no real customer data. There are no invented testimonials, member counts or booking guarantees. The owner's later pricing correction below supersedes the initial free-account copy.

Motion respects reduced-motion preferences. The owner's later refinement removes the initial custom pause control. Content remains visible without JavaScript; focus reveals pending content, feature tabs support arrow/Home/End navigation, and FAQ disclosures use native details/summary. The global reveal controller skips this page so whole sections never become transformed scroll containers. The page adds no database query, polling, analytics or animation dependency.

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

## Owner refinement — pricing and scroll mouse

The owner clarified that the platform will not be free. Remove free-pricing promises from the vendor page, including both hero/closing notes, the pricing FAQ and EN/ES metadata. The neutral audience note remains; no rates, billing model or checkout were specified or implemented.

The vendor page's animation control and arrow/caption are removed. It reuses the homepage's exact `wm-founders-hero__scroll-cue`, `scroll-mouse` and `scroll-wheel` classes: a 21×33px mouse, animated wheel and 48px keyboard-accessible link centered at the bottom of the hero. The action focuses the next section and leaves it clear of the fixed header. Automatic system reduced-motion handling remains.

Architecture, types, lint, production build and all 160 application tests pass in the isolated snapshot of `9ac22fd9` plus these page changes. All 15 [local production HTTP checks](refinement-local-http-checks.json) and six [bilingual desktop/phone checks](refinement-local-interactions.json) pass. The latter verify no free promise or animation button, identical mouse dimensions, centered placement and no horizontal overflow at 320/390/1440 widths. Keyboard scrolling focuses the destination below the header.

Release **ff43b847fedae5a498bfe716a02c552c6bb7ac9e** is verified live with its [exact gateway receipt](deployment-refinement.json), rollback `/var/www/wedding-market.before-20261030-193023`, and all 15 [public checks](refinement-public-checks.json) passing.

## Headline typography references

The owner then supplied references for the hero, the “Your business / Beautifully connected” section and the closing headline: large GT Super serif first lines with Lucia script second lines, compact leading and a slight overlap. All three accent lines now share the existing homepage script treatment: 0.96em size, 0.95 line height, −0.28em top margin and normal script styling. The hero's serif tracking matches the homepage. Other page headings retain their existing typography.

This is a CSS-only website refinement using the already installed fonts. The previous removal of free claims and the animation control, the shared homepage mouse, bilingual copy and signup paths remain. The final production build and all 15 local HTTP checks pass. The local browser could not reconnect to the standalone preview; final visual checking will use the public page after deployment.

Typography commit **4cbc0f9441be7962130199d0e9294e956f7577bb** is built but not deployed. The gateway accepted the request, then its preflight stopped before creating a new receipt: `/var/www` had **5,341,536,256 bytes free**, below the unchanged **6,442,450,944-byte (6 GiB)** build reserve. Available memory was adequate. The transient service was collected; its default `success`/inactive fields do not prove a deployment. The receipt still identifies the live **ff43b847** release.

The existing `wedding-market-retention.timer` is loaded/active and last ran October 30 at 06:56:58 UTC. Its next scheduled run is October 31 at 06:33:02 UTC. The installed service matches the reviewed retention unit and preserves the active release, verified rollback, releases younger than 24 hours, in-use releases and dirty/mismatched source. It has no data-backup or DW write access. The owner has been asked to run `systemctl start wedding-market-retention.service` from their root terminal; the audit identity has only the fixed deployment gateway. No cleanup, reserve reduction, privilege expansion or customer write was performed by this task. Recheck free space after the owner action, retry the existing typography manifest, then require its exact successful receipt and public visual verification.

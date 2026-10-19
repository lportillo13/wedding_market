# Account inbox organization

The owner supplied a Samsung Browser screenshot showing a cramped account inbox: duplicate page headings, a full-width status strip, unlabeled metadata and a small isolated delete control above a large newsletter promotion.

## Changes

- Account navigation is now compact and localized. The hardcoded English `My Account` heading was removed; the content page supplies the single primary heading. The Inbox section remains active when viewing a conversation.
- Client and vendor lists share a presentation component. Each card separates the counterpart, short status chip, message preview, labeled wedding details, update time and inquiry reference. Delete/restore controls have visible labels and stay separate from the conversation link.
- Search, folder links, inquiry filters and pagination keep their scope. Empty, deleted and search-result states have useful next actions. Vendor empty states link to the vendor's own profile.
- Previews fall back to the inquiry message when no proposal note exists. Zero-price proposals remain proposals; an unpriced proposal is not labeled as absent. Dates retain the shared calendar-day formatter.
- Account pages and vendor inbox routes use a compact legal footer. Public marketing pages keep the existing newsletter/footer. The previous duplicated inbox card CSS was removed; common collection controls were retained. A source comparison confirms every stylesheet rule from the notification-page section onward is unchanged.
- Server-side authentication, inbox loaders, ownership checks, read handling and delete/restore server actions retain their existing implementations. Presentation summaries contain no contact-email or phone fields. No database migration, dependency change or native binary is included.

## Validation

TypeScript, ESLint and all 54 web tests passed. New regressions cover scoped links/pagination, inquiry-message fallback, excluding contact fields from presentation summaries, zero/unpriced proposals and invalid activity dates.

The actual account header, inbox component and workspace footer were checked with fictional conversations in English and Spanish at 390×844, 320×568 and 1280×900. Observed one primary heading, no horizontal page overflow, and card actions at least 44 pixels high. Long vendor names, multiple cards, search and inquiry filters, empty and deleted states, a simulated delete/restore, and vendor-specific routes/guest counts were inspected. The phone header starts below the site header; legal links remain available. The temporary preview route and controls are removed before release.

Previews: [Spanish phone](preview-mobile-es.png), [English desktop](preview-desktop-en.png). They contain fictional records, not the owner's private conversations. Local Supabase is offline, so real authenticated mutation acceptance is not claimed. Live deployment verification passed for the exact release, public pages/assets, anonymous account/vendor gates and protected API/origin behavior.

## Release status

The final production build passed after the stylesheet cleanup was narrowed and rechecked. No preview route is in the production route manifest. The assistant deployed `21e91da8975ce008e36c2134e22ab24933dc8e72` through the installed gateway from verified live base `3254c5b2f336299e8f5543301b385cb695de2f1b`. The gateway exited successfully and the [exact-commit receipt](deployment-success.json) confirms `applicationDeployed: true`, step `complete`, and successful shadow/live probes. Manifest SHA256: `9b5296ce903411459fe7a1f3afe44a3b6a32f7e7ef1d845fec92fb75af5b4ea8`. Rollback copy: `/var/www/wedding-market.before-20261019-222607`.

[Independent public verification](public-release-checks.json) passed for health, homepage, directory, the existing editorial vendor profile, bounded directory API, security headers and privileged/native API authentication. Anonymous client inbox/deleted-folder requests redirect to `/signup`; the vendor inbox redirects to `/signup/vendor`. All three public stylesheets load successfully and include the new conversation/workspace rules plus retained notification-page styles. Direct-origin HTTPS access returns 403. This release updates the responsive website; no native binary is published.

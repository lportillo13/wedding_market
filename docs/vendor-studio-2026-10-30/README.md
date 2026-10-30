# Vendor studio A and account destinations

The owner selected **vendor Option A — Business studio**, separately from the
earlier header A and personal-profile A decisions. The vendor's own workspace
now uses a persistent grouped sidebar on desktop and four primary destinations
plus a grouped section selector on phones. Home, Inbox, My business and Calendar
remain directly accessible. Boutique tools appear for relevant vendors and
vendors who already own a boutique.

The approved warm ivory/champagne/brown styling, GT Super headings and Acumin
controls continue through the workspace. The editor groups presentation, media,
services/prices and contact/location, with team and reviews under optional
details. All existing fields, upload limits, inquiry workflows and publication
rules remain. English and Spanish content share one presentation form; optional
translation, profile-address and extra-description controls use disclosures.

Each section has its own save status and sticky save action. Switching sections
retains mounted drafts; leaving the editor warns about unsaved edits. Category
buttons and map changes participate in dirty-state tracking. Failed saves retain
entered values. Starting price has an independent save in Services & prices;
saving contact details cannot accidentally clear it. The saved-information
checklist suggests useful edits without creating new publication requirements.

Published listings retain their public preview. Draft listings open an
authenticated **saved-details preview**, explicitly described as private saved
data rather than an exact public-profile canvas. The loader derives the owner
from the verified session, accepts no arbitrary vendor ID/slug, and does not
publish or cache private data. Workspace client state is keyed by verified user
ID so it cannot carry a draft into another account.

## Account-menu repair

The header previously inferred that every nonvendor was a couple. For a
signed-in account without the couple role, the account/RFQ layout sent the
visitor to signup, which then sent an existing account home. The header now
loads both capabilities from server-verified role RPCs. Couple-only inbox/quote
links appear only for eligible accounts; an unsupported direct visit explains
the account requirement instead of bouncing home. Guests keep their sign-in
return destination.

Personal profile, favorites and own notification destinations remain available
without granting a couple role. Notification route wrappers now sit outside the
couple-only layout; their existing recipient-scoped queries/actions and RLS are
unchanged. Legacy vendor category/location URLs redirect into their new editor
sections. No role grants, database migration or live customer-data edits are
part of this release.

## Validation

- Architecture (474 modules), TypeScript, lint and production build pass. The
  sandbox initially prevented Next from creating a generated directory; the
  same production build completed with the required filesystem access.
- 145 web tests pass, including sidebar routing/grouping, bilingual forms,
  verified account capabilities, independent price saves and own-only preview.
- 49 isolated database security, boutique and signup tests pass. No database
  structure changed.
- All 41 [local production HTTP checks](local-http-checks.json) pass, including
  protected notification/preview destinations, quote sign-in continuation,
  auth journeys/assets and studio styling. The removed fixture route is 404.
- [Local interaction checks](local-interaction-checks.json) use fictional data
  with authentication and all writes denied by the isolated local transport.
  Draft retention, independent price drafts, category dirty state, leave-page
  warning, failed-save retention, overview links and EN/ES passed. At 320px the
  document has no horizontal overflow, inputs use 16px text and Save is 48px tall.
- The temporary fixture, route and bypass flags were removed; local fixture
  servers stopped. No real profile save, upload, message or publication was used
  for browser verification. Native publication remains held.

Deployment and live verification evidence will be recorded here after the exact
release succeeds. The prior verified base is
`facdeecbb1550dd86c82d99a5e911c84993b66e6`.

## Authentication options discussed

The owner's follow-up asks for automatic login/signup options. The suggested
combination is Google, Apple, email-code fallback and remembered valid sessions.
Google OAuth UI already exists in the web source; live provider configuration
has not been verified. New users must still complete the required couple or
vendor details. Existing verified identities should be linked/reused rather
than creating duplicate accounts. Passkeys are a later experimental option.
This question does not enable a provider or change authentication settings.

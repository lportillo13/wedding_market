# Editorial A emails and signup-delivery investigation

The owner reported no signup confirmation at their supplied address around 02:00 UTC
on October 30 and requested the website's styling on every email.

## Implemented

- One shared email-safe Editorial A frame: warm ivory, brown, champagne rules, serif
  headings, the existing WM identity, compact controls and support/privacy links.
- All 13 Supabase authentication/security templates, with English/Spanish bodies.
  Existing token variables and the browser-safe password-recovery endpoint remain.
  Publishing changes no SMTP credentials or security-notification enablement.
- Application quote/request/acceptance/message emails and formerly plain deletion
  receipts use the shared frame. Escaping, private conversation destinations, delivery
  status, idempotency and deletion final-review requirements remain intact.
- The confirmation screen offers password recovery for someone who already confirmed
  their account, without revealing whether any address is registered.
- The API publication script now supports a verified readback. This release used the
  authenticated hosted editors instead; every save completed and signup/recovery
  content was reopened to verify persistence. The repository templates are generated
  from the shared frame to avoid drift.

## Validation and publication

Architecture, TypeScript and ESLint checks passed. The production build passed after
retrying outside the Windows sandbox, which initially blocked an output directory.
All 122 web tests passed. Twenty-seven English/Spanish HTML previews use fictional
data and send no emails. Browser previews do not prove Gmail/Outlook rendering or
real email delivery.

Application **63a042ae01e6a7325a177f1ded679623e9fffee3** is deployed through the
fixed gateway, with its exact [successful receipt](deployment-success.json) and
all **29 public checks passing** in [the report](public-checks.json). Rollback is
`/var/www/wedding-market.before-20261030-023515`.

All **13 hosted Auth/security subjects and HTML bodies are published** in WedMarket,
using native controls in the owner's ChatGPT browser. Every content save returned
the clean disabled-save state; multiple saves also showed the success notification.
The signup and recovery source/subjects persisted after navigation away and back.
All seven pre-existing security-notification switches were off and remained off.
No credential, rate limit, confirmation policy or account state was changed.
The existing custom SMTP configuration was verified enabled with Wedding Market's
`accounts@mail.thewedmarket.com` sender, `smtp.resend.com`, port 465 and username
`resend`. The credential stayed masked. [Sanitized publication record](auth-template-publication.json).

The [local preview](confirmation-desktop.png) resolves Go variables with fictional
data. Supabase's [hosted preview](hosted-confirmation-preview.png) shows the saved
layout but leaves Go conditionals/URLs literal; its broken placeholder image is not
evidence of a real sending problem. The live Site URL is verified as
`https://thewedmarket.com`. No real signup/recovery email was sent during these checks,
so new-message delivery and Gmail/Outlook rendering are not claimed.

## Missing confirmation: existing confirmed account

The owner's supplied address matches one existing email/password account: created
October 9, 2025 and **already confirmed March 24, 2026**, as read in the project's
user overview. Resend's exact-address search returned no results in its last-15-day
window. Another signup for an already confirmed account does not require another
confirmation. The person should sign in to the existing account or use the normal
password-recovery flow; do not delete/recreate the account or disable confirmation.

The native Chrome session was a different Supabase account and signed out of Resend.
The browser automation backend reported disabled, but the owner correctly identified
authenticated sessions in ChatGPT's own browser. Native `cua.getApp` controls accessed
that browser and completed the work. Browser snapshots sometimes preceded actual
page updates; screenshots and later states confirmed each change. No token or real
authentication link was copied to the repository.

The newsletter form only stores opt-in and sends no automated mail. No broadcast was
created or sent. Future broadcasts must reuse this design with Resend unsubscribe
management.

References: [Supabase templates](https://supabase.com/docs/guides/auth/auth-email-templates),
[signup behavior](https://supabase.com/docs/reference/javascript/auth-signup),
[project email operations](../email-delivery.md).

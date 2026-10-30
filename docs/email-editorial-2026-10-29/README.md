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
- Auth publication now reads the hosted configuration back and verifies every updated
  field. The repository templates are generated from the shared frame to avoid drift.

## Validation and publication

Architecture, TypeScript and ESLint checks passed. The production build passed after
retrying outside the Windows sandbox, which initially blocked an output directory.
All 122 web tests passed. Twenty-seven English/Spanish HTML previews use fictional
data and send no emails. Browser previews do not prove Gmail/Outlook rendering or
real email delivery.

Application deployment receipt and public verification will be recorded here after
the fixed gateway completes. Hosted Auth templates have **not yet been published**.

## Delivery investigation remains open

The available native Chrome Supabase session only has the separate Digital Wedding
organization, not Wedding Market (`aousexbvujjnvbudpsmz`, CR Wedding Destination).
The Resend session is signed out. The owner requested the ChatGPT browser; opening
it returned `Local browser use is disabled in Work settings`. Browser access must be
enabled before continuing there. No provider credential was created, changed or
printed, and no real verification email was sent during this investigation.

Inspect only the supplied signup address and its short attempt window: creation/
confirmation status, confirmation-send timestamp, Auth error/rate-limit events, then
the corresponding Resend status/suppression details. Do not disable confirmation,
delete the account, or assume a missing message means the SMTP sender failed. An
existing confirmed address may receive an obfuscated signup response without another
confirmation; this possibility is **not yet verified for this attempt**.

The newsletter form only stores opt-in and sends no automated mail. No broadcast was
created or sent. Future broadcasts must reuse this design with Resend unsubscribe
management.

References: [Supabase templates](https://supabase.com/docs/guides/auth/auth-email-templates),
[signup behavior](https://supabase.com/docs/reference/javascript/auth-signup),
[project email operations](../email-delivery.md).

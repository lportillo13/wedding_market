# Social and email-code account access

The owner approved Google and Apple sign-in/signup for couples and vendors,
email-code fallback and persistent valid sessions on October 30, 2026. This
website change retains the Editorial A styling and English/Spanish support.
Native source/publication remains held.

## Implemented

- Shared Google/Apple buttons and email-code controls on login, couple signup
  and vendor account creation. Public provider flags are fetched through a
  small public-only endpoint with a 60-second cache lifetime. Disabled providers
  are visibly unavailable; they do not send visitors into a broken OAuth flow.
  Enabling a configured provider takes effect without another application build.
- OAuth uses the existing Supabase PKCE exchange. Account intent and validated
  local return paths survive the callback and retry. An explicit personal-profile
  destination stays personal; default login selects the verified workspace.
- Email-code requests reuse existing identities or create a normal confirmed
  identity after verification. Entry supports the provider's numeric code length,
  resend delay, request guards, errors/retry, keyboard entry and OTP autofill.
  No account-existence lookup is exposed by the code flow.
- New accounts choose couple/vendor when needed. Verified couples reuse all six
  existing planning steps with a locked credential email and no second password
  or Auth signup. Required contact, style and valid date remain; estimates stay
  optional, including a real zero budget. Saves update only the verified owner's
  existing profile and cannot change roles or overwrite another account.
  Vendors continue into the existing guarded business/media journey. If Apple
  provides no personal name, the first business step asks for it and the server
  checks it before uploads. Existing names are retained without asking twice.
- The last Continue action in both couple and vendor setup now stays on review,
  rather than changing into a submit button during the same click. Only explicit
  final submission saves.
- The community-rules notice waits until account setup finishes. Recorded
  consent and all server-side posting/contact restrictions remain unchanged.
- Persistent secure production cookies, browser token refresh and a bounded
  server proxy refresh keep valid sessions working on return. Chunked cookie
  writes/removals and private cache headers remain on the returned response.
  Late refresh results cannot write after the six-second deadline. Guests,
  static assets and bearer API requests do not trigger proxy refresh calls.
  Existing verified-user, account restriction, RLS and moderation/MFA checks stay.
- Website visits on `www.thewedmarket.com` redirect to the configured canonical
  origin before session refresh, retaining path/query without trusting a caller's
  Host as the destination. This keeps PKCE and persistent cookies on one host.
  Previously www-only sessions may need to sign in once on the canonical host.

## Email publication

Confirmation and magic-link/OTP templates now show `{{ .Token }}` in the existing
branded code block, with localized instructions and the original confirmation
link retained. Both updated HTML bodies were copied back through the editor and
matched the repository source before saving; each hosted save returned the clean,
disabled-save state. The returning-account subject now names the sign-in code.
SMTP credentials, confirmation policy, expiry/rate limits and security email
switches were not changed. No real email was sent for validation.

## Provider setup status

The authenticated browser confirmed Google and Apple were disabled and their
credential fields empty. Google Cloud project `the-wedding-market-a627b` and
Apple team `PORTILLO'S DESIGN CR LLC` are accessible. Google branding/audience
setup was prepared; the owner completed Google's policy acceptance and Create.
After explicit credential-creation approval, the website OAuth client was created
and the owner entered its credentials directly in Supabase. Google is enabled;
its read-only OAuth probe reaches Google with the correct Supabase callback and
only email/profile scopes. Homepage/privacy/terms branding links were completed.
After separate explicit approval, Google publication was confirmed **In production**.
No credential is recorded here. The download bridge returned no Google JSON file;
the owner used the secure provider UI instead.

Apple Services ID `com.theweddingmarket.web` is registered and configured with
the exact Supabase return host/URL. Automatic approval review rejected a change
that would invalidate the existing native provisioning profiles. That change was
cancelled. A separate primary App ID, `com.theweddingmarket.webauth`, was created
and used instead; the existing native App ID/profiles and DW remain unchanged.
The explicitly approved Sign in with Apple key is created and scoped only to this
web primary. Apple marks the one-time key download complete; its local file path
is awaiting the owner before a client secret can be generated. A local
ES256 client-secret generator has two passing signature/validation tests and
writes only an ignored local credential file, never the token in logs.

[Provider setup handoff](PROVIDER-SETUP.md) records the public identifiers and
remaining credential steps. Apple activation and a real external sign-in are
not yet verified. Email access remains available. Apple email-relay source
registration was explicitly approved and saved for `mail.thewedmarket.com` and
`send.mail.thewedmarket.com` after public DKIM/SPF checks; no DNS records were
changed. Existing verified-email identity linking is delegated to Supabase;
no manual-linking or unverified-email bypass is enabled.

The canonical Supabase Site URL is verified as `https://thewedmarket.com`, with
the canonical and www callback URLs already allowed. No broad wildcard or new
foreign redirect origin was added.

## Validation

- 157 web tests, 49 isolated database regressions and two local Apple-secret
  generator signature/validation tests pass. New cases cover
  account intent/return paths, role/ownership, verified setup validation, provider
  flags, code syntax, cookie chunks/removals, cache headers and refresh deadlines.
- Architecture (486 modules), TypeScript, lint and final production build pass.
- All 48 [local HTTP checks](local-http-checks.json) pass, including explicit www
  login/callback redirects with retained return parameters and no cookie writes.
- [Interactive local checks](local-interaction-checks.json) use only a fictional
  identity and isolated local authentication transport. Social handoffs stay
  local, code send/invalid/valid verification works, setup has no password,
  review has zero writes before explicit submission and exactly one afterward,
  the original quote-page destination returns, sessions survive reload, and
  vendor setup reuses the identity. A nameless verified vendor is focused on the
  required name field before advancing, then proceeds without a password. A
  known name is not requested again; its hidden form control is present, while
  the browser redacts the value and the server fallback is unit tested.
  No quote, message, upload or agreement was
  submitted. These checks do not claim real Google/Apple or email delivery.
- At 320px, the client and scroll widths both measure 305px, access buttons are
  50px tall and code inputs use 16px text. EN/ES and the viewport were restored.
  Local test servers are stopped; no fixture route or bypass exists in app code.

## Verified website release

Live application: **76bc5eb844aeb4283815bbd8b5cc85a817a29762**, through the fixed
gateway. The [successful receipt](deployment-success.json) confirms the exact
target and preserves rollback at `/var/www/wedding-market.before-20261030-173123`.
The verified base was `e6067d18d0ec62527a9edc3a558e2975ac09ee5d`; the
[initial auth receipt](deployment-initial.json) and
[vendor-name/review receipt](deployment-vendor-details.json) retain earlier releases.
All 48 [public HTTP checks](public-checks.json) pass, including www redirects. The
[live owner-browser checks](live-browser-checks.json) confirm the session stays
signed in across the www redirect, an explicit personal-profile return stays personal, and default vendor
login returns to the vendor workspace. No owner form was submitted.

[Google provider handoff](google-provider-check.json) verifies the configured
redirect without granting Google consent or linking a real identity.
[Mail DNS readiness](apple-mail-dns-check.json) retains only public validation
metadata, never key values. Provider dashboards are configured independently of
the application release. [Activation status](provider-activation.json) records
Google enabled/in production, the retained email/nonce requirements, registered
Apple relay sources and the remaining local-key-file handoff. The native release remains held.

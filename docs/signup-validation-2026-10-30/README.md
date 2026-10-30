# Signup email validation and a single language control

The owner requested rejection of an already registered email at the first signup
step, and removal of the second language selector inside account screens.

Couple signup now checks the address before leaving the account step. Both couple
and vendor server submissions recheck it before calling Auth. Matching trims
whitespace and ignores letter case; confirmed and unconfirmed accounts both count
as existing. EN/ES inline feedback marks the email field and offers sign-in and
password-recovery links. A changed address clears the duplicate feedback, requests
are guarded while pending, and a failed lookup keeps the person on the form.
Obscured duplicate Auth responses with empty identities also become errors rather
than a misleading confirmation screen. Provider uniqueness remains authoritative
for concurrent signups.

The server-only lookup returns one boolean and no account details. Migration015
revokes function execution from PUBLIC, anonymous and authenticated roles; only
the already privileged server role can call it. Public form checks have bounded
per-process admission (15 attempts per ten minutes, at most 1,000 hashed client
keys), a five-second request deadline and the existing production edge limits.
No email address is stored in that limiter. The lookup does not create or change
accounts and sends no email. The UI requests it on Continue, not every keystroke.

The shared account layout no longer renders its own EN/ES controls. The main
header and existing language persistence remain in use across account journeys,
login, confirmation and recovery.

Architecture, TypeScript, lint and production build pass. **132 application tests**
and **49 isolated PostgreSQL tests** pass; the migration replay and database
inspection pass. The live migration source and function body match after normalizing
browser CRLF line endings, with server-only execution independently verified.
See [source digest](migration-source.json) and [live receipt](migration-live-receipt.json).

Application **fa0d65aedd3061da105fe1a780432d753010c2eb** is verified live by
the exact [gateway receipt](deployment-success.json) and all **31 public checks**
in [the report](public-checks.json). Rollback is
`/var/www/wedding-market.before-20261030-140737`.

A temporary anonymous preview forwarded the actual live page/assets and only the
read-only email-check action. It stripped authentication cookies and rejected
account-creation submissions. The owner's existing address, including an uppercase
variant, remained on step1 with inline EN/ES feedback and correct recovery links.
An unused reserved-domain address cleared the feedback and advanced to step2;
returning and re-entering the existing address blocked again. Exactly three lookup
requests returned200, with duplicate results true/false/true. There was one header
language group and zero account-layout language controls. At a390px viewport,
document client/scroll widths both measured375px. The viewport was restored and
the temporary preview stopped. No account was created, no profile was changed and
no mail was sent. Private screenshots remain in ignored cache.

Existing unrelated working changes and the held native release are preserved.

Provider reference: [Supabase signup behavior](https://supabase.com/docs/reference/javascript/auth-signup).

# Full authentication journey tests

Status: in progress. The owner requested live Google/Apple signup and sign-in for
couples and vendors, email-code fallback and returning sessions. Passed checks
below are separated from provider/account cases still pending.

## Confirmed gateway failure and repair

The signed-in browser received 502s at signup and at the real Google callback,
while anonymous requests worked. Normal sign-out restored guest access. A
bounded root diagnostic subsequently confirmed an authentication callback header
overflow. Nginx rejects upstream response headers larger than its first response
buffer ([official documentation](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_buffer_size)).

The owner ran the reviewed, checksum-pinned repair on October 30. It added only
Wedding Market's `proxy_buffer_size 32k`, `proxy_buffers 4 32k` and
`proxy_busy_buffers_size 64k`, validated/reloaded Nginx and kept a protected
backup at `/var/backups/wedding-market-auth-proxy/20261030-181755`. The audit
identity independently read back the settings. Other site files, the fixed
deployment gateway, account roles and authentication protections were unchanged.
[Receipt](gateway-repair.json), [owner command](RUN-OWNER-REPAIR.md).

Six isolated repair tests cover host/upstream boundaries, idempotency, existing
custom settings, and bounded log classification without retaining authentication
codes or raw log lines. The owner-run repair refuses to change configuration
unless recent matching callback header-overflow errors are confirmed.

## Verified live journeys

- Google: a real existing-account round trip now reaches the existing personal
  profile and survives reload. The failed callback also recovers to a retry page
  after the gateway repair. The owner used an already registered account, so this
  is returning sign-in rather than a fresh Google signup.
- Email-code couple signup: a separate owner-controlled QA alias received the
  real branded confirmation/code message in Gmail Inbox. One deliberately wrong
  code was rejected; the delivered eight-digit code succeeded. The verified
  account completed all six steps without a password. Required name validation,
  contact country, style, calendar navigation, optional-field skipping and review
  edits worked. The profile remained unchanged until explicit final submission;
  the saved profile retained a real zero budget and omitted guest estimate.
- All 157 application and 49 isolated database regressions pass.

The QA profile is named `WM QA Email Couple 20261030`. Its reserved example
phone and fictional wedding data belong only to that private test account. No
real owner's profile, inquiry, message, vendor booking or publication was edited.
Community posting terms were not accepted by the assistant.

## Presentation correction

The verified couple review still referred to a password and another confirmation
email. The EN/ES correction uses verified-email instructions and a Save and
continue action. Architecture, types, lint and production build pass; the isolated
browser verified both languages and draft retention when switching language.
Application deployment of this copy correction is pending.

## Remaining live cases

Fresh Google signup needs a Google identity not already registered with Wedding
Market. The owner has only the existing administrator identity available; that
production account is being preserved, including its profile and admin access.
Apple consent/signup/sign-in, vendor onboarding, returning email-code
login, and Apple relay code delivery remain to be exercised. Source/unit or
isolated fixture coverage does not claim these live journeys have passed.

[Current matrix](results.json) contains only pass states and non-secret metadata.
Private keys, JWTs, verification codes, raw callback URLs and email screenshots
are excluded from repository evidence.

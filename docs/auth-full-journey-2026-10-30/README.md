# Full authentication journey tests

Status: available-account journeys verified. Fresh Google signup identities and
Google branding re-verification remain pending. The owner requested live
Google/Apple signup and sign-in for couples and vendors, email-code fallback
and returning sessions. Coverage and limitations are separated below.

| Journey | Verified result |
| --- | --- |
| Google returning owner | Real provider login and remembered session; original Luis Portillo profile restored after QA. |
| Google fresh couple/vendor identities | Not exercised: no unused Google identity was available; the administrator was preserved. |
| Apple new couple | Hide My Email, direct missing-details wedding setup, explicit save and remembered session. |
| Apple returning couple | Real provider round trip to the requested couple inbox and remembered session. |
| Apple vendor | The isolated Apple couple identity was reused: six-step business setup, separately approved terms, private business creation and a real returning Apple provider round trip to the vendor profile. |
| Email codes | Separate couple/vendor signup and returning login; Apple relay fallback reused the same identity before and after vendor conversion. |
| Relay placement | First relay email arrived in Spam; after reporting that known test message not spam, the next real relay email arrived directly in Inbox. This does not establish placement for all recipients. |

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
- Returning email-code login: the same private QA account received the branded
  sign-in-code message in Gmail Inbox and reached its requested account inbox.
  A reload during the application release briefly received 502; after the exact
  successful release receipt, reload restored the signed-in inbox without
  another code. The public post-release checks also pass.
- All 160 application and 49 isolated database regressions pass.

The QA profile is named `WM QA Email Couple 20261030`. Its reserved example
phone and fictional wedding data belong only to that private test account. No
real owner's profile, inquiry, message, vendor booking or publication was edited.
Community posting terms were not accepted by the assistant.

## Presentation correction

The verified couple review still referred to a password and another confirmation
email. The EN/ES correction uses verified-email instructions and a Save and
continue action. Architecture, types, lint and production build pass; the isolated
browser verified both languages and draft retention when switching language.
The copy correction is deployed in `cdcf970505dad696e5fd764be876e3b3030712e2`,
with 48 public checks passing and rollback
`/var/www/wedding-market.before-20261030-184317`.

## New social accounts: wedding onboarding

The owner clarified that new Google and Apple couple accounts must enter the
wedding-details form directly. Incomplete couple accounts now go to verified
couple setup from both authentication continuation and an already signed-in
login visit. Setup starts at the first missing required detail: known name/email
are retained, missing names are requested, then contact, wedding style and date.
Guest count and budget remain optional. Existing completed accounts retain
explicit destinations, and vendor signup/private vendor entry retains business
onboarding. The explicit account-choice route remains compatible.

Architecture/types/lint/build and all 159 tests pass. The isolated browser
verified an incomplete account's inbox return being preserved, missing-name
entry, contact-first entry when the name is known, contact-to-wedding-style
progression in EN/ES, and vendor login entering business setup. No local fixture
profile writes, messages or external provider calls were made. Deployment of
this routing correction completed as `efa5bfbe2bcc62bdbdd7ee684ad3da21ea1bcca3`.
All 48 public checks pass; rollback is
`/var/www/wedding-market.before-20261030-191230`.

## Google account-chooser branding

Google production audience is enabled, but branding verification separately
reported unverified ownership of the homepage and an insufficiently distinctive
logo. The approved WM SVG masters now generate a square Google-specific full
wordmark lockup via `node scripts/generate-brand-assets.mjs --google-auth-only`.
This flag leaves native/store assets unchanged. The approved full-name lockup
is now saved and visibly confirmed in Google's current-logo preview. The first
replacement attempt crashed before save; the fresh-tab upload/save succeeded.
Branding verification/publication and a branded chooser are not yet confirmed.
No paid Supabase custom-domain upgrade was purchased.

The owner approved publishing Google's generated HTML ownership proof and
verifying `https://thewedmarket.com/` for `lportillo1313@gmail.com` after reviewing
the prepared Search Console screen. The downloaded file's exact expected
contents were checked before copying it to `public`. Release
`4f1ea63144e1901dcfb7fea79410f1e5188457b6` published the exact file, public HTTP
verification passed, and Google Search Console confirmed ownership via HTML
file. Google reports a 24-hour propagation wait before retrying branding
verification. Do not remove the file while that ownership is needed.

## Vendor signup consent repair

The new vendor QA alias received its real branded confirmation in Gmail Inbox,
verified the code and entered the six-step business setup without a password.
The owner-name fallback, media selection, coverage, contact, languages, required
starting price and explicit review all worked. Opening another own-profile tab
after deployment preserved the review and media selections. A previous draft
reset during concurrent deployments; it was re-entered after deployment ended.

The final save was rejected because current community terms were not accepted,
while account-entry screens hid the acceptance control. This exposed a real
signup blocker. The existing failure
path cleans up staged media. The repair adds the existing consent control inline
at final vendor review and checks the verified own profile's recorded version
before any image upload. The final save stays disabled until consent is
recorded. Existing database posting rules remain in force.

All 160 application and 49 database tests pass, as do architecture, types, lint
and production build. An initial restricted build could not write a generated
Next types directory; the complete check passed with normal build access. The
local browser verified EN/ES labels, disabled final save, no nested forms,
retained review/images across language changes, and recoverable consent failure.
The fixture did not reach its simulated consent RPC; successful acceptance
and final business creation were validated separately on live with explicit
owner approval, as recorded below.

The owner then explicitly approved acceptance of the current Terms and
Community Guidelines for the isolated vendor QA identity and creation of its
unpublished test profile. Release `9ac22fd9b9127be449c92265fff6fc8f34ae6965`
completed with 48 public checks passing; rollback is
`/var/www/wedding-market.before-20261030-192524`. The live inline agreement
recorded successfully, retained the review and selected files, and enabled the
final save. The created business `WM QA Private Draft 20261030` reached its
vendor workspace with explicit **Borrador privado** status. Reload retained the
session; the business editor retained its name, biography, USD 250 price and
optimized 1600×1000 WEBP cover, which loaded successfully. Nothing was published.

Returning vendor email-code login also passes: a second real sign-in message
arrived in Gmail Inbox, its delivered code returned the QA vendor to the
explicit `/vendor/inbox` destination, and reload retained that session and the
private-draft status. The QA session was then signed out normally to prepare
the Apple test. No inquiries, proposals, bookings or publications were made.

## Apple couple signup and returning login

After the owner completed Apple's identity verification, a real new Apple
identity returned directly to `/signup?complete=1` at the missing contact step.
Apple's name and verified email were retained; no password or extra verification
email was required. The review visibly confirmed an Apple private-relay email.
The authentication input's value was redacted by the browser, so its initial
masked value was not evidence of the email-sharing choice; only the review's
visible address established Hide My Email.

The isolated profile was labeled `WM QA Apple Couple 20261030` and completed
contact, garden style, calendar selection of April 12, 2027, optional estimate
skipping and explicit final review/save. Its own personal profile retained those
values and the session after reload. No community agreement was accepted for
this Apple identity at this stage.

A deliberate sign-out and fresh Apple login then requested `/account/inbox`.
Apple required its password again; the owner completed that step, and the
already-authorized Continue confirmation returned to the requested inbox.
Reload retained the session. These checks ran on production
`ff43b847fedae5a498bfe716a02c552c6bb7ac9e`, independently confirmed by the release
receipt; that vendor-page refinement includes the auth repair above.

Apple private-relay email fallback also passes. Its real eight-digit code was
forwarded to the owner's Gmail, initially in Spam. Gmail reported similarity to
messages classified as spam in the past; the visible details showed relay
mailed-by/signed-by and TLS. The known test message was reported not spam and
Gmail confirmed moving it to Inbox. Its code reached `/account/inbox` and the
profile retained the exact QA name and wedding date, confirming the existing
Apple identity was reused. This is not evidence of clean first-delivery Inbox
placement or of a global deliverability repair.

The same isolated Apple identity was reused for business setup rather than
claiming a second unused Apple account. Verified vendor entry retained its saved
owner name, asked for no password, and reached all six review steps with QA
images, coverage, contact, languages and USD 250 starting price. The owner
separately approved its agreement acceptance and conversion to an unpublished
vendor profile. The existing browser tab was unavailable after the handoff;
the exact same approved draft was restored in a fresh tab, with the QA identity
checked before acceptance. Recorded consent preserved review/images, and final
save created `WM QA Apple Private Draft 20261030` with private-draft status.
Reload retained the vendor session.

The next real relay-code email arrived directly in Gmail Inbox. An initial
attempt read Gmail's stale earlier message and the consumed code was correctly
rejected. Refreshing the Gmail thread and waiting for the new message timestamp
yielded its current code, which reached `/vendor/inbox`; reload retained the
vendor session. No sender allowlist, spam filter bypass or DNS change was made.

For the final Apple provider check, the owner completed the older Apple tab's
password step; its existing-app Continue confirmation returned to
`/vendor/profile` for the correct private QA business. That session survived
reload. The redundant prepared Apple tab and completed test-mail tab were
closed. A normal returning Google login then restored the original Luis Portillo
profile without saving changes to it. The QA businesses remain unpublished.

The successful fixed-gateway receipt observed at the end identifies production
`4cbc0f9441be7962130199d0e9294e956f7577bb`. Its application diff from the auth repair
changes only the public vendor marketing page, not the authentication modules.
No new authentication source or deployment was needed for these final tests.

## Remaining live cases

Fresh Google signup needs a Google identity not already registered with Wedding
Market. The owner has only the existing administrator identity available; that
production account is being preserved, including its profile and admin access.
Google new/vendor identity coverage still needs an unused Google account.
The Apple vendor test reused one isolated identity after couple setup; it does
not claim a second fresh Apple identity was created. Google branding remains
unverified until the ownership propagation wait and a successful re-verification/
publication. Source/unit or isolated fixture coverage does not claim the missing
real Google identity journeys have passed.

[Current matrix](results.json) contains only pass states and non-secret metadata.
Private keys, JWTs, verification codes, raw callback URLs and email screenshots
are excluded from repository evidence.

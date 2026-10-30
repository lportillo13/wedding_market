# Editorial A — complete account journeys

The owner selected **A — Editorial welcome**, then clarified that the redesign must cover every step for couples and vendors and authorized process improvements. The website implementation covers registration, review, email confirmation/resend, shared sign-in, forgotten passwords and password reset. Native publication remains held.

## Every step

| Couple journey | Purpose |
| --- | --- |
| 1. Account | Name, email and password, with password visibility and an eight-character hint. |
| 2. Contact | Phone and contact country; the wedding remains in Costa Rica. |
| 3. Style | Seven visual choices using native keyboard-accessible radio inputs. |
| 4. Date | Calendar selection with localized day names, full date labels and selected state. |
| 5. Optional estimates | Guests and budget in USD; both can remain blank, with Skip for now. |
| 6. Review | Earlier details with edit links; passwords are never shown in the summary. |
| 7. Verify email | Confirmation instructions, optional resend form and sign-in continuation. |

[Couple visual walkthrough](couple-walkthrough.png)

| Vendor journey | Purpose |
| --- | --- |
| 1. Account | Name, email and password. Business details and uploads follow verification. |
| 2. Verify email | Confirmation instructions, resend and return to vendor setup. |
| 3. Business | Name, short introduction and actual service categories. |
| 4. Photos | Required logo and cover image, with local previews and replacement controls. |
| 5. Service area | Business country, city/region and service style; extra coverage options remain available. |
| 6. Contact | Phone or website, service languages and optional additional contact details. |
| 7. Pricing | Starting amount/currency, optional experience and additional pricing details. |
| 8. Review | Selected images, business details and edit links; creating a profile does not publish it. |

Account verification is a three-stage overview (account, email, profile); the verified business profile has its own six-step progress indicator.

[Vendor visual walkthrough](vendor-walkthrough.png)

These boards contain actual **local development previews**, including the development indicator, fictional example details and a visible disabled-submission fixture label on the verified vendor screens. They show particular scroll positions rather than the whole height of each screen. Later refinements distinguish Stage from Step, clarify the couple confirmation continuation, retain files after a recoverable submission and make control corners consistently 4px. The deployed screenshots will be recorded separately. No company depicted in the preview is a new production record.

## Process repairs

- Couple signup previously unmounted earlier inputs without submitting their name/email/phone/country on the last screen. The complete state now supplies the server action, and inputs remain mounted as users move between steps. The separate welcome click is removed; the required planning/contact fields remain.
- New vendors previously completed the entire business form and selected photos before discovering that confirmation was required; the unauthenticated branch then discarded that business work. A short account-first action now performs email verification before business collection. Both entry paths share one provider registration implementation. Verification still grants no vendor role; the existing authenticated profile creation workflow remains authoritative.
- Verified vendor submissions contained null values for absent optional signup credentials, which the prior schema rejected. The maintained vendor schema accepts their absence while keeping business validation. No anonymous vendor write or role bypass was added.
- Review is a distinct step in both flows. Existing vendor fields and category-specific requirements remain. All file selections and text stay in memory across back/edit navigation. A bounded pair of File objects supplies retry submissions if React resets native file controls after a recoverable action. Nothing is saved to local storage or shared across accounts.
- Login remains shared, with direct couple/business registration links. Email, OAuth, recovery and resend have pending/error feedback and duplicate-request guards. Expected provider failures are localized. Callback and recovery return paths reuse the existing internal-path sanitizer, including duplicate-parameter/non-string protection. Google returns to the vendor profile for the default account destination when the session has the vendor role. Browser-history restoration clears stale OAuth pending state.
- Recovery and reset share the selected visual treatment. Intended destinations survive callback/reset failure and password-update sign-in. Confirmation resend uses generic wording and retains provider rate limits. Recovery/confirmation pages use the compact workspace footer.

## Visual treatment and assets

Desktop uses a large coastal wedding image beside the ivory form, light GT Super headings, Acumin labels, a restrained Lucia photo caption and warm brown actions. Phones use a smaller 62.6 KB photo crop, labeled 48px fields, clear stage/step progress and visible sticky wizard actions. Long stages scroll naturally. Existing header/navigation, account rules, private data boundaries, publication consent and media admission limits remain.

The decorative photograph was generated with the built-in image generation tool from the approved A composition; it is not a vendor or venue listing. Sources consumed by the website are `public/images/auth-editorial-welcome.webp` (268,724 bytes) and `public/images/auth-editorial-welcome-mobile.webp` (62,572 bytes). The supplied existing font files are reused; no font or image purchase occurred. See [the photograph prompt](hero-prompt.txt) and [the original three concept prompts](../sign-in-options-2026-10-29/prompts.json).

## Verification

Local native Chrome checks walked all six couple form screens, skipped the optional estimates, and found the previously entered account/contact/style/date details in review. English/Spanish switching retained that state; the 320×568 Spanish review kept its actions readable.

The verified vendor form was tested only in a temporary source-verified local fixture with submission capture disabled. Fictional business/contact data, one explicit example category, the existing WM icon and the generated decorative photo were selected. Business, photos, location, contact/languages, pricing and review were inspected; review edit returned to both selected filenames and image previews. Spanish 320×568 checks retained the files and scrollable controls. No account/profile was created, no production object was uploaded and no confirmation/reset email was sent. The fixture source is removed before the production build; final HTTP checks require its URL to return 404.

Regression tests cover complete couple serialization, optional estimates, edits/password preservation, account-first vendor confirmation destination, verified vendor setup without credentials, file retry/replacement, feedback categories and safe OAuth/recovery redirects. **All 121 web tests, architecture, TypeScript, lint and the final production build pass. All 29 local HTTP/asset checks pass**, including EN/ES HTML, private/no-store auth responses, nested recovery returns, missing-code callbacks, exact hashes for both photo sizes and existing fonts, compiled journey styles and the removed fixture's 404. See [HTTP results](local-http-checks.json) and the [actual final local production desktop](local-production-desktop.png). No schema migration, infrastructure change, store upload or native release is part of this work.

## Publication

Pending the final checks and restricted-gateway release. Require an exact target-commit success receipt and public asset/route verification before recording completion here.

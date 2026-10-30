# Sign-in design options — October 29, 2026

The owner requested analysis, improvements and three visual options for the couple/vendor sign-in process, selected **A — Editorial welcome**, then explicitly expanded the work to every couple/vendor registration step and authorized process improvements. See the [complete journey implementation and walkthroughs](../sign-in-editorial-2026-10-29/README.md). Native publication remains held. The three images below remain the original concept alternatives.

## Deliverables

Each concept shows desktop and mobile website views of one shared account entrance, with separate couple and business registration links.

- [A — Editorial welcome](option-a.png): large wedding photograph beside a compact ivory form; short photo strip on phones. Recommended for continuity with the current editorial website.
- [B — The invitation](option-b.png): centered invitation panel with a fine botanical accent and wedding photography behind it on desktop; clean ivory form on phones.
- [C — Continue the moment](option-c.png): contextual desktop side panel and mobile sheet above the browsing page. Direct login/recovery URLs would still need a usable standalone presentation.

Images were generated with the built-in image generation tool and visually reviewed. They are conceptual UI images, not screenshots of working features, typography proofs, device acceptance checks or actual vendor photographs. Generated browser address text is illustrative; the real website is thewedmarket.com. The existing brand reference was docs/vendor-signature-2026-10-29/live-vendor-signature-desktop.jpg. Exact generation prompts are in [prompts.json](prompts.json). The generated B includes background photography despite the original request for a plain canvas; the delivered direction is described above as rendered.

## Current flow analysis

Read app/login/LoginClient.tsx, app/login/page.tsx, app/auth/callback/route.ts, app/forgot-password/ForgotPasswordClient.tsx, app/signup/page.tsx, app/signup/SignUpForm.tsx, app/signup/vendor/page.tsx, app/signup/vendor/VendorSignUpForm.tsx, app/signup/vendor/VendorSignupPageContent.tsx, app/signup/vendor/presentation.ts, components/PasswordInput.tsx, lib/auth-redirect.ts and relevant styles. Native AuthScreen/styles were inspected for context. The saved October 27 login image is historical, before the latest type changes. Live browser inspection was unavailable because local browser use is disabled in Work settings; no current live visual or authenticated-flow verification is claimed.

1. Email/password login already serves both account types and resolves the default email/password destination using is_vendor. Keep one login; another required role choice would add friction.
2. Login currently exposes only the couple registration link. Add a direct Register your business link to the existing vendor onboarding route, alongside the couple account link.
3. Keep persistent field labels, password show/hide, recovery, autofill and English/Spanish support. Make shared couple/vendor access explicit in the introduction. Maintain legible phone layouts and touch controls through short screens and keyboard appearance.
4. Email/password errors currently display raw provider messages in a div without role=alert. Map expected failures to clear localized messages, announce them accessibly and retain entered email.
5. Google sign-in currently has no pending guard and ignores the returned OAuth error. Add pending/error feedback for OAuth and prevent repeated submissions while either authentication path is pending. Async completion/failure should always restore usable controls.
6. Callback failures redirect to /login?error=auth_callback, but the login page does not consume this error. Explain expired/failed sign-in clearly and offer retry/recovery. Preserve intended destinations through recovery/registration where appropriate.
7. app/login/page.tsx only checks startsWith('/') for next, unlike the existing safeAuthNextPath helper used by the callback. Any implementation should reuse that helper consistently and retain its existing redirect safety tests.
8. Password recovery already has a sent state and accessible status. Restyle it to match the selected direction, retaining anti-enumeration wording and existing authentication requirements. Do not add new auth methods or make unverified provider-configuration claims.

## Implementation after selection

Use the existing supplied GT Super, Acumin Pro and restrained Lucia assets, rather than fonts inferred from the raster mockups. Preserve the header/navigation structure, verified wordmark, role/account rules, return paths, server protections and existing signup requirements. Any change to signup data requirements is a separate product decision.

Validate EN/ES desktop and 320/390px phone layouts, keyboard/autofill, errors/loading, callback failures, recovery and intended return paths. Run checks appropriate to actual code changes, deploy the completed selected website implementation through the established gateway and verify the exact receipt/public result. These are future checks, not results of this options task.

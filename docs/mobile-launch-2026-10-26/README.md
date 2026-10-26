# Wedding Market mobile launch preparation

Prepared October 26, 2026. This is the first preparation package, not a completed store submission. The owner's priority is a coherent logo, favicon and app identity, with launch work informed by Digital Wedding's actual release experience. The owner subsequently asked to improve the logo direction; the second concept board refines the WM monogram. A final identity is not yet selected.

## Branding first

View [the refined WM concept](brand/identity-refinement-v2.png) and [the original three directions](brand/identity-concepts-v1.png). Both are raster concept boards generated with the built-in imagegen tool; prompts are preserved alongside them. They are review presentations, not production logo/icon files. Existing files in `public/brand` are earlier drafts and have not been replaced.

The proposed direction uses ivory `#FBF7F0`, champagne `#C9AC79`, cocoa `#4B352C` and taupe `#8E7766`, respecting the warmer wedding styling already requested. Refine optical balance and one-color legibility before adoption. The full serif monogram and its simplified small symbol need separate treatment: a 16 px favicon or notification glyph cannot depend on fine overlapping details. The board's small previews do not establish pixel-level legibility or actual transparency.

Produce one approved, reproducible identity with these outputs:

| Asset | Production deliverable / verification |
| --- | --- |
| Primary logo | Editable vector master with outlined type, horizontal and stacked lockups; cocoa, ivory/reversed, and one-color versions; transparent SVG/PNG exports and usage sheet. Check font rights before outlining. |
| App icon | Opaque 1024×1024 PNG master for iOS/default native use; leave OS masking to the platform. Check current dark/tinted/layered-icon support against the chosen Expo/iOS build tools. |
| Android adaptive icon | Separate transparent foreground and background; keep the mark inside the safe zone and inspect round, square and squircle launcher masks. |
| Android themed icon | A separate monochrome layer derived from the simplified symbol. This is a quality goal, not a claim that it is required for store approval. |
| Android notification icon | A separate 96×96 all-white mark on actual transparency. Inspect the compiled resource and a real notification; never use the colored square app icon. |
| Splash | Separate transparent mark on an ivory background. Verify a preview/production binary; Expo Go and development-client splash screens can differ. |
| Website favicon | SVG plus ICO containing 16/32/48 px sizes; inspect at true tab-icon size. Replace `app/favicon.ico` as well as public icons when approved. |
| Home-screen/PWA | 180 px Apple touch icon; 192/512 px standard and safe-zone maskable PWA icons; update manifest and layout references together. |
| Shared brand surfaces | Website header/footer, auth emails, native account/header, splash, notification accent and store art. Preserve the approved navigation layout. |
| Store artwork | Google Play 512×512 listing icon and 1024×500 feature graphic; EN/ES screenshots of the final native UI with fictional data. Capture current required iPhone/iPad dimensions from App Store Connect. |

The native palette currently contains teal and gold values distinct from the website. Apply the approved identity consistently in a later application change rather than treating an attractive board as an already-integrated asset system. Do not regenerate logos independently at each size: derive exports from the final master.

## What we learned from Digital Wedding

These lessons come from reading `C:/dw/mobile/store/README.md`, its saved October 23 Apple review reply, the notification-icon checks, source preparation/preflight scripts, and the October 26 review-thread record. No Digital Wedding files or external accounts were changed. The cross-project evidence is historical; Wedding Market console/signing state has not been verified.

| DW experience | Wedding Market action |
| --- | --- |
| Apple requested five business-model answers under 2.1(b), holding the first release. | Prepare Wedding Market-specific answers before submission, covering who pays, where, existing access, in-app purchases and bundles. Its real-world-service marketplace is different from DW's web-hosting companion. |
| A launcher logo was unsuitable for the Android notification slot; the actual packaged resource needed checking. | Use dedicated white/transparent artwork and verify AAB/APK resources plus device delivery. |
| An early EAS packaging attempt selected the large parent repository. | Use the new root `.easignore` source allowlist and inspect the real archive before uploading. Wedding Market must include sibling `shared` rules. Do not copy a DW-only mobile-folder snapshot that drops those imports. |
| Listing screenshots needed genuine native UI and source/build provenance. | Capture Android, iPhone and supported iPad from the final candidate, both languages, with fictional client/vendor data; retain capture and artifact hashes. Do not present browser mocks as native screenshots. |
| DW's test APK had a different package/signature from its store artifact. | Verify Wedding Market's permanent identifiers, signing fingerprints and upgrade behavior. Record whether a preview replaces the existing app before installing it. |
| Google published automatically after approval when managed publishing was off. | Configure the desired release control explicitly in each console. EAS Android submission now defaults to an internal draft; use manual Apple public release and deliberate Google publishing. |
| Upload, processing, review, approval and public availability were different milestones. | Keep a receipt per milestone and verify the public listing/install path. A successful EAS build is not a published app. |
| Physical-device acceptance remained separate from local exports and static binary checks. | Track owner/device confirmation explicitly, especially sharing, auth links, permissions, notifications, media and keyboard/accessibility behavior. |

## Current blockers and unknowns

1. **Identity and assets:** current native icon is 512×512; notification config reuses a colored 192 px icon; splash and adaptive icon reuse the launcher image. No final monogram, proper notification glyph, themed layer or production brand pack is adopted.
2. **Account deletion:** native controls open `/account-deletion`; its only action is an email request. Implement authenticated deletion/initiation with confirmation, actual processing, status/timing and verified dependent-data handling. Preserve legitimate shared booking/conversation history through an explicit retention/anonymization design. This is different from hiding or archiving a thread.
3. **User content:** no native report/block controls were found for messages, reviews or uploads. Implement the user and server moderation flow, filtering, enforcement and timely support handling.
4. **Support and declarations:** `/support` returns 404; policy pages in source are English-only; the published contact domain differs from the public application domain and its mailbox was not verified. Confirm legal publisher, monitored support, retention and the EN/ES text. Do not inherit DW's LLC/trader declarations or vendor-payment assumptions automatically.
5. **Native release proof:** store records, name availability, Apple signing, Android upload key, FCM/APNs credentials, EAS production environment and current build status are unknown. Old 2026 preview references do not establish the current candidate.
6. **Privacy and permissions:** inspect native SDK manifests/permissions, session persistence/backup, consent, message/media handling and actual processor collection. The source uses AsyncStorage for the auth session; review storage and backup protections before release.
7. **Acceptance and listing media:** release-build Android/iPhone/iPad testing and genuine EN/ES screenshots remain outstanding. Keep accounts and fixtures isolated from real clients/providers.
8. **Dependency advisories:** after the compatible Expo patch updates, `npm audit` still reports five high-severity package findings from two underlying advisories in the Expo CLI/signing dependency chain. See [validation and advisory scope](validation.md). Resolve or document the actual exposure and disposition before signing; do not downgrade the application to Expo SDK 44 just to satisfy npm's suggested forced fix.

## Work order

1. Refine/select the identity; prepare vector and production exports; validate small sizes and native masks.
2. Implement deletion, reporting/blocking and support; finish bilingual policy text and factual privacy inventory; deploy verified web/backend work through Wedding Market's existing restricted gateway.
3. Set the launch version (source is still `0.1.0`), confirm both store records and release countries, review production public environment, push credentials, auth confirmation/recovery redirects and signing ownership. Keep all private credentials outside source, notes and archives.
4. Inspect EAS source archives for both platforms. The root allowlist includes `mobile` sources/assets and `shared`; it excludes the web/backend and environment/signing files. Verify actual contents and hashes before any remote build; the allowlist alone is not archive proof.
5. Build signed Android/iOS candidates only after the preceding blockers are cleared. Verify Android target API 36+ and 16 KB native-library compatibility in the actual bundle; verify Apple's current iOS 26+ SDK requirement in the IPA/build receipt. Verify native permission prompts, app icons, crash/startup behavior, artifact size and no privileged credentials.
6. Test with dedicated fictional client/vendor accounts on Android, iPhone and supported iPad, then capture screenshots. Cover fresh install, upgrade, signup/confirmation, login/recovery, denied permissions, background/terminated notifications, uploads, slow/offline errors, language persistence, deletion and abuse controls. Explicitly retest independent acceptance/contact consent for two vendors in one group request.
7. Finish EN/ES metadata, privacy/data-safety, age/content ratings, app access, trader/contact declarations and testing requirements. Use the consoles' actual requirements; the personal-account 12-testers/14-days rule is conditional on account type/date. Review the concrete final package before submission/public launch.

## Prepared files and safe defaults

- [Listing copy](../../mobile/store/listing.json): EN/ES drafts with field-length checks; support and publisher confirmation intentionally unresolved.
- [Review notes](../../mobile/store/review-notes.md): five business-model answers to finalize, least-privilege review-account plan and native walkthrough.
- [Privacy inventory](../../mobile/store/privacy-inventory.md): source-backed data categories, current gaps and public-page check results.
- [Offline audit](../../scripts/audit-mobile-launch.mjs): checks identities, versions, release profile, submission defaults, declared languages, copy lengths, archive policy and actual image pixels. Reports manual verification separately and never certifies submission readiness.
- Native config now explicitly declares English/Spanish, production store/device builds and Android internal/draft submission. It preserves existing package identifiers and version. No signed candidate, upload, submission, app-store publication or live application deployment was performed for this preparation-only batch.

From `C:/wedding-market/mobile`:

```powershell
npm run launch:audit
npm run launch:audit -- --strict
npm run check
npm run export:android
npm run export:ios
```

The normal audit writes `.cache/mobile-launch/readiness.json` and exits successfully when the inspection itself completes; this does not mean launch readiness. `--strict` exits 1 while blockers or required verification remain. The current preparation receipt is [readiness.json](readiness.json). Local export uses the local environment and proves bundling, not correct production configuration, a signed binary or physical-device behavior.

[Validation details](validation.md) record the 49 mobile tests, audit tests, online Expo compatibility check, Android/iOS exports, scope limitations and open dependency findings. There is no deployable website/backend change in this preparation batch; native release publication remains a later milestone.

## Official references checked October 26, 2026

- [Apple account deletion](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion): email-only support deletion is insufficient for an ordinary app that creates accounts.
- [Apple review guidelines](https://developer.apple.com/app-store/review/guidelines/): check 1.2 for user content, 2.1 for completeness/review access and 3.1.3(e) for physical services; paid digital promotion is a separate issue.
- [Apple SDK minimum](https://developer.apple.com/news/?id=ueeok6yw): iOS/iPadOS 26 SDK or later for uploads starting April 28, 2026.
- [Google target API](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en-EN): new phone apps/updates target Android 16/API 36 or higher from August 31, 2026; inspect actual console applicability.
- [Android 16 KB guidance](https://developer.android.com/guide/practices/page-sizes): verify native libraries and packaging; recheck the current policy for the release date.
- [Google testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en-mt), [listing artwork](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en).
- [Expo icons/splash](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/), [SDK 56 notification icon](https://docs.expo.dev/versions/v56.0.0/sdk/notifications/), [EAS ignore rules](https://docs.expo.dev/build-reference/easignore/), [monorepo setup](https://docs.expo.dev/build-reference/build-with-monorepos/), [archive inspection CLI](https://docs.expo.dev/eas/cli/#eas-buildinspect).

These requirements can change; recheck them when preparing the final submission. The preparation documents do not approve a legal declaration or establish external console state.

# App styling aligned with the website

The owner requested consistent app design and styling with the refined website. This pass updates the existing native application source and shared styles. **The app release remains held.** No EAS update, signed application build, store upload or release was performed. Later website releases are tracked in [the current project context](../project-context.md).

Validated, held native source: **b548640ce80a26e9eb3b783eb529e339d612154e**. Later documentation-only commits do not imply a new app artifact or publication.

The subsequent [sample-vendor review](../example-vendors-2026-10-28/README.md) at **3e71d123b783a2f28ff17c184ed65bc5ab8f8743** adds an explicit development-preview entry and shared sample data. Its 76 tests and both local platform exports pass. That is the latest held native source; no native cloud update or distribution followed.

## Implemented design

- GT Super Light for display text and the uppercase Wedding Market wordmark, Acumin for body text and controls, and Lucia for the home hero accent. The former Playfair dependency is removed. Explicit native font faces replace synthetic heavy weights in 140 text styles.
- The same warm ink, ivory, champagne, muted text and divider colors as the website. Shared controls use 7px corners and calmer surfaces use 10px corners. Large rounded containers, heavy labels and decorative shadows are reduced across home, authentication, calendars/selectors, vendor search/cards/profiles/editors, favorites, quotes, account settings, admin and inbox styles. Semantic error/success/booking colors remain meaningful.
- The native home uses the website's bilingual heading, a centered light-serif/script pairing, regular supporting copy and consistently padded actions. Text responds to screen width and the hero grows with content, rather than forcing larger text under the header. Category and planning sections use light headings and fine dividers.
- The account popup and language controls share the web menu's ivory finish, light heading and clear selected state. The existing native header, safe-area composition, full-screen menu hit bounds and bottom navigation remain intact.
- Forms retain their workflows while sharing readable labels, 16px inputs and larger controls. Login removes redundant branding/nested horizontal padding. Selectors wrap long labels and keep a clear close target; directory filters and signup close controls have accessible names. Signup progress/footer now use the warm palette.

The feature modules and business rules remain in their established locations. No inquiry, booking, permissions, consent, notification or deletion workflow was redesigned. The website's botanical decoration is not introduced into the app.

## Font provenance

Seven original OTF/TTF files were copied from the owner's supplied archives into `mobile/assets/fonts`. [sources.json](../../mobile/assets/fonts/sources.json) retains their archive paths, SHA-256 values and copyright metadata. The original Grilli Type trial EULA is retained alongside the files. The copyright notice generator now reads this inventory instead of the removed Playfair package. These remain the owner's non-final font evaluation; no license purchase or commercial app distribution is claimed.

## Validation and visual evidence

[Final validation](validation.json) passed native type checking, lint, all **75 tests / 16 suites**, online Expo dependency compatibility, architecture checks, and local Android/iOS Hermes exports. Source hashes match before/after validation. Both platform exports include all seven requested font assets. The exported bundles use local development configuration and are compilation artifacts, not production releases.

Actual native visual review used an isolated Android API 36 emulator with official Expo Go **57.0.9**, two CPU cores and 2 GB memory. This is native React Native rendering, not a website or mockup. Guest-only checks covered the bilingual home, account menu/language selection, directory, login, signup introduction and empty first-step fields. Spanish remained selected after stopping/relaunching the preview. No personal information, account submission, consent acceptance or customer write was used. The directory continued to show its truthful empty state.

A 320×640-point screen with text scale **1.3** kept the wordmark and hero clear of the header, wrapped the actions vertically and allowed the main action to be reached by scrolling. Display/text-size overrides were restored. The small-screen screenshot documents this native check. Existing public-only screen captures are linked below; the floating gear belongs to Expo Go's preview tools and is not part of the application UI.

- [English home](android-home-en.png), [Spanish home](android-home-es.png)
- [Account/language menu](android-menu-en.png), [Spanish login](android-login-es.png)
- [Spanish directory](android-directory-es.png), [Empty signup fields](android-signup-fields-es.png)
- [Small phone with larger text](android-small-large-text-es.png)

iOS passed bundle/asset checks; this Windows session did not provide a new iPhone/iPad simulator or physical-device visual review. Authenticated workspaces inherit the shared theme and passed the existing functional tests, but this guest-only visual pass does not establish signed-in device acceptance. The already submitted store binaries and review metadata were not changed. The temporary emulator, development connection and Metro server were stopped after verification. [Capture provenance](native-preview.json) records the native runtime, test sizes and image hashes.

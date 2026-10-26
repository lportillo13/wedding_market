# Preparation validation — October 26, 2026

The prepared source is not a signed store candidate. No EAS build/upload, store-console edit, reviewer-account creation, database mutation, live web deployment or public release was performed.

| Check | Result |
| --- | --- |
| Mobile TypeScript | Passed after patch updates. |
| Mobile ESLint | Passed with zero warnings after patch updates. |
| Mobile Jest | 10 suites / 49 tests passed after patch updates. |
| Expo compatibility | Online check passed after aligning Expo `~56.0.24`, dev client `~56.0.28`, splash `~56.0.16` and jest-expo `~56.0.6`. Lockfile updated. |
| Offline audit regression tests | 5 passed: empty, opaque, colored and translucent notification-image failures; white mark with transparent padding; listing field validation. |
| Launch audit source checks | Node syntax check and focused ESLint with the repository ignore override passed. |
| Android Hermes export | Passed, 750 modules, approximately 2.8 MB bytecode plus font assets. |
| iOS Hermes export | Passed, 751 modules, approximately 2.8 MB bytecode plus font assets. The CLI printed a forced-exit notice after successful export and returned exit 0. This is bundling on Windows, not an iOS native build. |
| Source-ignore policy samples | The installed Git-ignore matcher included native config/code/assets and sibling shared rules; excluded server/admin source, root/mobile env files, credentials/signing examples, store docs, dependencies and unrelated attachments. Real EAS archive proof remains pending. |
| Launch audit | Inspection completed; 8 source/asset checks pass, 7 are blocked, and 12 require evidence. It explicitly reports `readyForSubmission: false`; strict mode must fail. |
| Public URLs | HTTPS privacy, terms and account-deletion returned 200; `/support` returned 404. No contact mailbox verification was performed. |
| Generated brand boards | Visually inspected as concept presentations; neither is an approved vector master, tested 16 px favicon, actual notification resource or final store asset. |

The initial sandbox Expo compatibility check fell back to its cached map. The online check then identified four compatible patch updates; those were applied before the final checks. Initial sandbox Hermes exports failed writing temporary bytecode; rerunning the same exports outside the sandbox succeeded. Neither failure was treated as a passed check.

## Open dependency findings

The final `npm audit --json` returned five **high** package findings and zero critical findings. Those five entries are `expo`, `@expo/cli`, `@expo/code-signing-certificates`, `node-forge`, and `zod`; they derive from two underlying advisories, not five independent defects.

- Installed `node-forge@1.4.0` is reached through `expo@56.0.24` → `@expo/cli@56.1.27` and `@expo/code-signing-certificates@0.0.6`. The [RSA signature verification advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv) lists versions through 1.4.0 as affected, with no patched version listed when checked.
- Installed `zod@3.25.76` is used by the Expo CLI and the ESLint hook tooling. The [resource-exhaustion advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) lists versions below 4.6.6 as affected. A blind major-version override of Zod 3 consumers is not an established compatible fix.

These are the dependency paths observed locally. This check does not prove those vulnerable functions are present or reachable in a shipped native binary, nor does it establish that build/signing exposure is safe. Review inputs, signing/verification paths, upstream fixes and final bundle contents before signing the release candidate. Keep build tools private and avoid untrusted certificate/config inputs while investigating. Npm suggests a semver-major Expo downgrade to 44.0.6 for parts of the chain; that would conflict with the current SDK and current store requirements, so no forced downgrade or unverified override was applied. The launch audit keeps this as required verification; the security audit is not clean.

## Practical limits

Local exports used the existing local environment and do not prove production endpoint correctness. Final AAB/IPA signing, compiled notification artwork, Android native library alignment/target API, Apple SDK/privacy manifests, push delivery, auth confirmation/recovery, permission behavior, physical-device acceptance and store forms remain unverified. No production users or messages were used as fixtures. Web/backend deployment must accompany later verified application fixes through the established Wedding Market gateway; publishing a mobile binary is separate.

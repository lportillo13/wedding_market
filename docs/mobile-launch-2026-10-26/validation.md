# Launch preparation validation — October 26, 2026

The web/backend and native source have distinct release evidence. Local native exports and EAS source archive inspection do not create a signed AAB/IPA or publish an app. The approved demo quarantine changed only the exact seeded cohort; no real customer account was deleted or used as a fixture.

| Check | Result |
| --- | --- |
| Web TypeScript / ESLint / production build | Passed; 64 static-generation entries and the new support/policy/deletion/moderation routes compiled. |
| Web application tests | 78 passed, including bounded caches/refresh/deadlines and deletion-provider failure handling. |
| PostgreSQL regressions | 32 passed with all migrations 000–011: ownership/MFA, deletion retry/isolation/stale JWT, consent/report/block/moderation, restricted-account deletion controls and exact-cohort quarantine rollback intent. |
| Architecture | Feature/shared boundaries pass; no dependency cycles or boundary violations. |
| Tooling tests | 14 passed: source archive failures, icon transparency/safe zone/alpha channel, literal listing limits, local seeder targets, database catalog/TLS and neutral PWA cache behavior. |
| Live database vs replay | Matches: 351 columns, 89 constraints, 79 indexes, 113 policies, 52 functions, 8 views. Only documented CRLF and PostgreSQL NOT NULL catalog differences are normalized. |
| Mobile TypeScript / ESLint / tests | Passed; 10 suites / 49 tests. |
| Expo compatibility | Online check passed for the selected SDK56 patch versions. |
| Android Hermes export | Passed, 802 modules, approximately 2.9MB bytecode, six font/brand assets. |
| iOS Hermes export | Passed, 803 modules, approximately 2.9MB bytecode. This is a local bundle on Windows, not an iOS native build. |
| Real Android/iOS archives | EAS25.2 archive stage passed. Both contain 94 byte-matched files, 1,070,054 bytes. Fingerprint `6e3157d2c569e852705aa2b400142c424d2ddf4c46ffaaab73c30e3233f23522`. No missing/extra paths, symlinks or known server-key markers. Full hashes in source-archives.json. |
| Brand pixels/config | 1024 RGB app icon without alpha; distinct safe-zone adaptive/themed layers, actual white/transparent96 notification mark, separate splash, web favicon/Apple/PWA sizes, Play512 icon and RGB1024×500 feature graphic. Owner approved the outlined identity. |
| Launch audit | 15 source/asset checks pass; zero blocked; 12 manual verification categories remain. Strict mode must remain nonzero and readyForSubmission remains false. The receipt records the base commit and whether native source was dirty. |
| Support inbox | Cloudflare inbound routing active; owner confirmed actual Gmail receipt. No paid mailbox subscription ordered. This does not configure outgoing replies or prove transactional delivery. |
| Demo directory | 152 confirmed seeds hidden and accounts restricted, zero seed listings remain published; four unmarked listings left unchanged. Aggregate receipt committed; private before snapshot/conditional rollback kept outside source. |

Production deployment/public verification will be recorded in adjacent deployment-success.json and public-release-checks.json. Native source packaging evidence is deliberately separate from signed binary/device/console acceptance. The initial archive attempt produced an empty directory; directory allowlist negations were corrected and real contents measured. Image alpha-channel inspection was added after finding fully opaque RGBA output. No unnecessary runtime dependency was added for branding.

## Open dependency findings

The final `npm audit --json` returned five **high** package findings and zero critical findings. Those five entries are `expo`, `@expo/cli`, `@expo/code-signing-certificates`, `node-forge`, and `zod`; they derive from two underlying advisories, not five independent defects.

- Installed `node-forge@1.4.0` is reached through `expo@56.0.24` → `@expo/cli@56.1.27` and `@expo/code-signing-certificates@0.0.6`. The [RSA signature verification advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv) lists versions through 1.4.0 as affected, with no patched version listed when checked.
- Installed `zod@3.25.76` is used by the Expo CLI and the ESLint hook tooling. The [resource-exhaustion advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) lists versions below 4.6.6 as affected. A blind major-version override of Zod 3 consumers is not an established compatible fix.

These are the dependency paths observed locally. This check does not prove those vulnerable functions are present or reachable in a shipped native binary, nor does it establish that build/signing exposure is safe. Review inputs, signing/verification paths, upstream fixes and final bundle contents before signing the release candidate. Keep build tools private and avoid untrusted certificate/config inputs while investigating. Npm suggests a semver-major Expo downgrade to 44.0.6 for parts of the chain; that would conflict with the current SDK and current store requirements, so no forced downgrade or unverified override was applied. The launch audit keeps this as required verification; the security audit is not clean.

## Practical limits

Local exports used the existing local environment. Production endpoints, app records, signing keys, APNs/FCM, permissions/privacy manifests, encrypted device-session/backup handling, Android target API/native alignment, Apple SDK, real native EN/ES screenshots and physical Android/iPhone/iPad acceptance remain release gates. The five high Expo-tooling package findings above remain open pending reviewed remediation/disposition; the audit is not clean. No signed cloud build, store upload/submission or public app release was performed.

The deletion/moderation provider drill and real backup-retention policy remain operational gates before store submission. Email completion requires sender API acceptance; final inbox receipt must be checked in the isolated drill. Root retention is reviewed/planner-tested but needs owner installation; no automatic cleanup is claimed active. Web/backend deployment follows the restricted Wedding Market gateway and preserves a verified rollback.

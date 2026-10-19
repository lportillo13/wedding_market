# Application release handoff — October 19, 2026

Status: deployed successfully as `2f0a556d`. The corrected owner retry passed shadow and live probes. Independent public HTTP and browser checks passed. Direct deployment gateway setup is prepared and still awaits one-time owner installation.

The owner explicitly requested deployment by default. The release includes code correctness (`c8a07804`), profile/editing UX (`fdc1306f`), the responsive website header (`098a5508`) and the tested deployment helper/default (`830791d4`). No new database migration or native binary publication is included.

## Verified preparation

- Retry target commit: `2f0a556df693d150ff3b10d1ec5a1b631bf06f6d`.
- Required current commit: `60cbcb5085d71b60100fa5c91e52b99079001740`.
- The audit account confirmed `/var/www/wedding-market` points to `/var/www/wedding-market-releases/20261019-185347-60cbcb5085d7`; local health returned 200. That account cannot traverse the private release or use sudo. The owner helper independently checks source and process identity before changing anything.
- All bundle, manifest, helper and wrapper checksums matched after upload. Synthetic Linux release-path, markup, security-header and anonymous native API probe tests passed. Available memory was approximately 6.6 GiB and free disk 59.7 GiB.
- Upload directory: `/home/wm-audit-20261019/application-release-20261019`. The wrapper is pinned to this exact manifest/helper and copies them to a root-private folder before executing.

| Artifact | SHA256 |
| --- | --- |
| Generated wrapper | `2431d17101b96152f5675f63d62ed190923b2eaaeba3542b7ee9aa743907d49b` |
| Manifest | `376cb5786970d703ee0588bdb987fe0b23bf9a5352d1268222a6d323785cb2f6` |
| Deployment helper | `fece91cc1cdbc1232ee5e7fc7b29d474497e43db456e2a77e9170ea609ef18cc` |

## Owner command used for this release (completed)

```bash
install -m 700 /home/wm-audit-20261019/application-release-20261019/run-owner-release.sh /root/wm-application-release.sh && printf '%s  %s\n' '2431d17101b96152f5675f63d62ed190923b2eaaeba3542b7ee9aa743907d49b' /root/wm-application-release.sh | sha256sum -c - && bash /root/wm-application-release.sh
```

Git, dependency installation, build and PM2 run as the existing `deploy` user. The helper builds a separate release, tests it on loopback port 3012, switches only Wedding Market, checks port 3001 and saves its PM2 state. It preserves the production environment and previous release; failed post-switch probes restore the preceding path/process. Nginx, database, credentials and backup configuration are outside this release.

The sanitized result was collected and required the exact target commit with `applicationDeployed: true`. Public homepage, phone menu, directory, anonymous API, header and origin checks are recorded below. Private build logs and environment files were not collected into chat.

## Successful retry verification

[deployment-success.json](deployment-success.json) records `applicationDeployed: true` for `2f0a556df693d150ff3b10d1ec5a1b631bf06f6d`. Both shadow and live probes passed for the homepage, health, bounded public directory, uploads, readiness, admin API and four native API routes. The previous release is preserved at `/var/www/wedding-market.before-20261019-212910`.

[public-release-checks.json](public-release-checks.json) independently confirms the public site and directory return 200, the new header is present, security headers remain installed, and anonymous privileged/native API requests return 401. A separately verified direct-origin HTTPS request returned 403. Browser checks on the public domain verified English/Spanish menus, all 19 categories, closing/focus behavior and a 390-pixel menu without horizontal overflow. Screenshots: [English](live-mobile-menu-en.png), [Spanish](live-mobile-menu-es.png).

## Assistant-operated deployment setup

The owner explicitly requested that the assistant perform future deployments directly. A fixed root-owned deployment gateway and checksum-pinned one-time installer are prepared. They grant only the release command through the existing audit identity, validate uploaded data and use a fixed installed helper. Synthetic Linux security/checkout/privilege tests and a syntax check of the exact sudoers rule passed. The setup is not installed until owner execution and independent sudo/job verification succeed. See [the operational instructions](../../deploy/remediation/README.md#direct-deployment-gateway).

## First attempt and correction

The owner ran the first wrapper. Its sanitized result, [deployment-attempt-1.json](deployment-attempt-1.json), records `applicationDeployed: false` at `clone reviewed source`; the live symlink and HTTP health remained unchanged. The isolated clone already contains `codex/audit-remediation`, so the original `checkout -b` fails on subsequent deployments. The helper now uses `checkout -B` only in that new clone. A real synthetic Git bundle test reproduces the original branch-exists failure, verifies the corrected incremental checkout and asserts production's files and commit remain unchanged. All retry checksums and Linux tests passed after upload.

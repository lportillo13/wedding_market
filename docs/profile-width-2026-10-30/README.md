# Profile width aligned with the account menu

The owner requested that the personal profile fill the same width as its account
menu. The profile's separate 52rem limit is removed. Its container and the account
menu now share `--wm-account-content-width: 1040px`, retaining the existing
responsive container gutters and form columns. This is a presentation change;
profile fields, role checks and save behavior are unchanged.

Architecture, TypeScript, lint and production build pass. No new tests were added
for this small reversible layout change. Live width/alignment measurements
confirm the live result. Application **0ae5cabfa3849f187d727253634685623f9f0311**
has its exact [successful receipt](deployment-success.json), all 31
[public checks](public-checks.json), and matching 1040px menu/profile rectangles
with identical left/right positions in [the measurements](live-alignment.json).
The requested [three header alternatives](../header-options-2026-10-30/README.md)
remain design previews; no alternative has been selected or published.

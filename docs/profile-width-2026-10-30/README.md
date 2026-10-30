# Profile width aligned with the account menu

The owner requested that the personal profile fill the same width as its account
menu. The profile's separate52rem limit is removed. Its container and the account
menu now share `--wm-account-content-width: 1040px`, retaining the existing
responsive container gutters and form columns. This is a presentation change;
profile fields, role checks and save behavior are unchanged.

Architecture, TypeScript, lint and production build pass. No new tests were added
for this small reversible layout change. Live width/alignment and responsive checks
are recorded after deployment. The requested three header alternatives remain
local design previews; no header alternative has been selected or published.

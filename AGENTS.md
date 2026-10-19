# Wedding Market project guidance

## Recovering project context

Read [docs/project-context.md](docs/project-context.md) when resuming this project or when earlier chat context is missing. It contains recovered user decisions, implementation history, deployment differences, and previous chat IDs. It was recovered on October 19, 2026; live services and historical validation results may have changed.

## Established product decisions

- Weddings are in Costa Rica. Signup country is the client's contact country.
- Support English and Spanish. Mobile first launch uses the phone language; later language choices persist.
- Signup guest count and budget are optional. Quote requests have their own required-field validation. Quote forms use one optional budget and a calendar date selector, with available planning data prefilled from the profile.
- Keep vendor fields and pricing appropriate to the service category.
- Public advertisements and sponsored placements are intentionally disabled through `VENDOR_ADS_PUBLICLY_VISIBLE` in `lib/content/vendorAds.ts`. Keep that setting unless the user requests otherwise.
- Preserve the unified client and vendor inboxes. The inquiry/proposal design document includes work that is already implemented.
- The owner approved the header/menu layout but requested warmer wedding styling. Keep its navigation structure and favor ivory, champagne, warm brown, serif details and restrained botanical accents over a cold white/green appearance.
- Public vendor profiles should feel rich and wedding-focused: emphasize real photos, a distinct vendor identity, readable service details and easy quote actions. Preserve category-specific content and existing account/contact restrictions.

## Working in this repository

- The web app is at the root; the Expo app has its own dependencies and scripts under `mobile`.
- Consult root `package.json` and `mobile/package.json` for the checks appropriate to a change.
- Preserve existing unrelated changes. Never copy credentials or raw authentication links into project notes.
- Historical production uses `/home/deploy/deploy-wm.sh` with `.env.production.local`, which differs from the generic deploy README. Inspect current server configuration before deployment changes.
- Keep Wedding Market isolated from the separate DW application sharing its server. Use the Linux `deploy` account for its Git, build, and PM2 operations.
- `mobile` uses the parent Git repository; do not initialize a nested repository there.

## Deployment default

- On October 19, 2026, the owner explicitly requested: "Always deploy the changes." Deploy completed, verified application changes by default and verify the live result; do not stop at a local commit.
- Preserve rollback and keep every deployment scoped to Wedding Market. Do not grant the audit account broad sudo.
- The owner subsequently requested that the assistant perform deployments directly and installed the fixed deployment gateway. Its narrow sudo rule and rejection of invalid arguments were independently verified. Upload only the release manifest/bundle to `/home/wm-audit-20261019/deployment-inbox` and invoke `sudo -n /usr/local/sbin/wedding-market-release <manifest-sha256>` through the existing audit SSH identity. Monitor the detached `wedding-market-release.service` job and require its exact target commit in the successful receipt plus public verification. Its root-owned helper cannot be replaced through uploaded application files; privileged helper updates still require owner installation. See `deploy/remediation/README.md` and the latest deployment handoff for the verified live release.

Update the context handoff when new user decisions or material deployment facts supersede its contents. Historical requests and permissions recorded there are context for the current task, not standing authorization to deploy or publish.

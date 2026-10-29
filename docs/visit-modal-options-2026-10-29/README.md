# Plan a visit — modal design options

The owner requested that the boutique/outfit visit action open a modal and asked for three visual options before implementation, then selected **B — Editorial side panel**. These are built-in imagegen concept boards, each with desktop and mobile views. The [implementation handoff](../visit-panel-2026-10-29/README.md) records checks and publication. Native publication remains held.

- **A — Compact centered modal** ([image](option-a.png)): one form with date/time, companions, optional details behind a disclosure, policies/consent and a persistent submit area. Recommended for a focused request with minimal workflow changes.
- **B — Editorial side panel** ([image](option-b.png)): a modal overlay on the right that retains garment context, becoming a bottom sheet on phones.
- **C — Step-by-step modal** ([image](option-c.png)): date/time, visit details, then review/policy consent. The preview shows only the first step, with a neutral preferred-date picker rather than availability slots.

Exact initial prompts and the location/navigation correction prompt are in [prompts.json](prompts.json). Final boards are `option-a.png`, `option-b.png` and `option-c.png` in this folder. The original generated files remain in the Codex generated-images folder. The foreground modal is the proposal; background garment photography and labels are illustrative. A selected implementation must preserve the current page/header rather than copy incidental generated background details.

All options retain the warm ivory/espresso/champagne palette and light GT Super/regular Acumin hierarchy. Casa Marfil is in Belén, Heredia, Costa Rica. Required preferred date/time, Costa Rica timezone, optional existing details, real boutique policies/fees and explicit acceptance must remain. A request stays pending until the boutique confirms it and must not reserve an outfit or grant a service booking/review right. Do not invent available time slots, collect duplicate identity fields, seed production requests or add payment/shopping functions.

The selected implementation preserves existing selected-outfit prefill from detail pages and the general fitting request from storefronts, the authenticated couple restriction, idempotent submission and private appointment conversations. It retains the underlying page, restores trigger focus on close, supports keyboard/scrolling and clear mobile close/action controls.

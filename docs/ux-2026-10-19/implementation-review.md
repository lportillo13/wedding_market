# Profile and editing UX review — October 19, 2026

This batch implements the owner's request to improve profiles and the way vendors add content. It follows the earlier code review in `docs/code-review-2026-10-19.md`. The changes are local on `codex/audit-remediation`; the live application remains release `60cbcb50`.

## What changed

| Area | Result |
| --- | --- |
| Web workspace | A profile header, publication status, four-step essentials guide and numbered section navigation replace the flat editor tabs. The guide reflects saved information and is advisory; team, reviews and dates remain optional. |
| Drafts and saves | Visited sections remain mounted, so changing tabs preserves unfinished edits. Each section has a sticky save bar and an unsaved indicator. Ordinary internal navigation and browser reload/close receive unsaved-change protection. Network failures return form feedback instead of throwing into an error boundary. Drafts are held in memory, not persisted after leaving or reloading. |
| Packages | Suggested services follow the vendor's categories. Vendors can add custom packages, give each a currency, write independent English/Spanish notes, or choose contact for price. Removing a package can be undone. Add focuses the new price field, and Enter in a custom package name adds the card without submitting the whole form. |
| Team | Clear empty state, automatic focus on a new name, removal with undo, accessible reordering, independent English/Spanish roles and biographies. Upload callbacks follow stable member IDs, and saving waits for headshot uploads. |
| Business details | Friendlier profile-address wording, useful phone/number keyboards and category-aware capacity fields. Event types have one editor under Contact, avoiding stale values overwriting another section's saved changes. Logo uploads save independently and are excluded from manual-field dirty tracking. |
| Public profiles | Package cards replace the wide pricing table. A quote action stays available at phone widths and follows the existing sign-in flow. The unsupported “Featured vendor” label is replaced with neutral copy. |
| Native editor | Saved metadata and images refresh without hydrating over other drafts. Saving feedback remains visible. Category suggestions, custom packages, preserved currencies/languages, confirmed package/team removal, stable team IDs and the essentials guide follow the web workflow. |

## Save correctness and maintenance

Web pricing, team, service options and availability now use the existing authenticated `replace_vendor_section` transaction. Invalid rows roll back both rows and settings; a failed child insert cannot leave an empty section. This uses migration `202610190002`, already applied to the audited live database, and adds no new migration.

The editor loads every saved package, including custom and former-category rows, and stops on failed section reads instead of presenting an empty list that could later replace saved data. Service-category rules, pricing labels and pricing conversion are shared by web and mobile. Expo Metro and Jest resolve shared-source Babel helpers from the native app's dependency directory; no dependency versions changed.

Price input accepts non-negative decimal amounts with at most two places and rejects ambiguous separators. Profile price columns are PostgreSQL `bigint`, unlike quote amounts. The limit therefore follows JavaScript's safe integer representation of cents, including large CRC amounts; zero prices remain zero. Mobile profile text saves also preserve unrelated `extra_info` settings, including linked reviews.

## Validation

- Web: typecheck, ESLint, production build and all 46 tests passed.
- Database: all 19 PostgreSQL regression checks passed, including new team-language and service-selection rollback cases.
- Mobile: typecheck, ESLint, all 44 tests and the Expo compatibility check passed. Android Hermes export passed (750 modules, approximately 2.8 MB).
- The final web build contains no `/ux-review` route. No dependency versions changed.

Browser checks used the actual editor/public-profile components with a synthetic photography profile on a temporary, development-only review route. Checked Spanish and English labels, drafts surviving tab changes, keyboard section navigation, custom package creation, Enter behavior and focus, package/team undo, the leave dialog, category-appropriate suggestions, hidden capacity for photography, mobile pricing cards and the quote action. At a 390-pixel viewport, the document content fit its viewport without horizontal overflow. The review route was removed before the production build and the local preview server was stopped.

Screenshots are synthetic examples, not production customer records:

- [Desktop workspace](profile-workspace-desktop.png)
- [Mobile public pricing](public-profile-mobile.png)

## Verification limits and release status

The local environment points to an offline Supabase instance. Successful signed-in saves, real uploads and the complete save/revalidation cycle still need an account-backed acceptance pass against a running development database. PostgreSQL transaction behavior was exercised in PGlite using the audited schema and synthetic records. Physical-device interaction testing remains outstanding; the Android export validates bundling, not touch interactions.

Unsaved drafts are not a substitute for saving. Browser Back navigation inside a single-page session is not covered by the ordinary-link confirmation. Existing server validation messages may still appear in English; the new editor interface, package names and bilingual content fields support English and Spanish.

No deployment, production content write, credential change, paid backup or ad activation was made for this UX batch. The previous database-backup, SQL network/SSL and R2 credential handoffs remain open.

# Collapsible phone directory filters

The owner requested a smaller filter area on the mobile vendor directory so the photo cards are visible sooner.

- Below 768px, **Search & filters / Búsqueda y filtros** starts collapsed and toggles the existing keyword/category form. The button exposes its expanded state and controlled form for assistive technology and supports keyboard activation.
- Applied keywords/categories remain visible with an active-filter count and a clear action, even while collapsed. Collapsing keeps draft values mounted. Clearing also resets the uncontrolled category selector when the route changes.
- Phone spacing above the cards is tighter. Desktop keeps the full search form visible regardless of the mobile disclosure state.
- Normal and opt-in sample directories use the same controls; GET search parameters and the sample-mode flag are preserved. No database or native application changes are included. The native release remains held.

Validation and the exact final website release are recorded alongside this handoff. Browser evidence covers phone collapse/reopen, draft preservation, search, translated summaries, clearing, and desktop visibility. Source checks include architecture, TypeScript, ESLint and the production build.

## Live and pending revisions

The collapsible phone layout is live at **3c74fd44298b0ea85069a0d500d4f14f58ea6d84**. Its successful gateway receipt confirms both shadow and live checks. At 390 × 844, the first vendor card begins at 443px and fits in the opening viewport; 320px and 1150px checks have no horizontal overflow.

**f211a790cf61414a9e0b6710982c6cbaffff562f** additionally remounts the category selector when the applied category changes. This fixes an existing stale dropdown selection after clearing through client navigation. The cards and applied summary already reset correctly on the live revision. This last correction passes the source checks but is **not yet published**: the subsequent gateway request was accepted, but its receipt did not advance, and a read-only disk check confirmed 6,273,073,152 bytes available, below the installed helper's 6 GiB precondition. No lower threshold, broader access or cleanup workaround was introduced.

The existing retention service is installed and its daily timer is enabled; the next run is October 29 at 06:56:39 UTC. The owner was asked to run `systemctl start wedding-market-retention.service` from their root terminal if they want the last correction published now. This service preserves the active/rollback releases and only prunes eligible older clean builds. Audit access cannot start it. No backup or release directory was deleted by this task. After cleanup, recheck the exact live commit and any concurrent boutique release before retrying the prepared bundle; never use a stale expected base.

# Collapsible phone directory filters

The owner requested a smaller filter area on the mobile vendor directory so the photo cards are visible sooner.

- Below 768px, **Search & filters / Búsqueda y filtros** starts collapsed and toggles the existing keyword/category form. The button exposes its expanded state and controlled form for assistive technology and supports keyboard activation.
- Applied keywords/categories remain visible with an active-filter count and a clear action, even while collapsed. Collapsing keeps draft values mounted. Clearing also resets the uncontrolled category selector when the route changes.
- Phone spacing above the cards is tighter. Desktop keeps the full search form visible regardless of the mobile disclosure state.
- Normal and opt-in sample directories use the same controls; GET search parameters and the sample-mode flag are preserved. No database or native application changes are included. The native release remains held.

Validation and the exact final website release are recorded alongside this handoff. Browser evidence covers phone collapse/reopen, draft preservation, search, translated summaries, clearing, and desktop visibility. Source checks include architecture, TypeScript, ESLint and the production build.

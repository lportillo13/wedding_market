# Sample vendors for design review

The owner requested test vendors to analyze listing and profile pages. Six explicitly fictional examples use the maintained web directory/profile components and the native directory/detail screen: venue, photography, planning, floral design, catering and music. The existing GT Super / Lucia BT / Acumin Pro design remains in place.

Website entry: `/vendors?examples=1`. Profiles use the reserved, exact `example-*` slugs. Search, category filters, reset links and breadcrumbs preserve the selected sample view. Every example card/profile is labeled; sample prices, reference stock photos, availability and reviews are disclosed. Profiles allow reviewing the normal inquiry form with its send button disabled and an independent no-send handler guard. Favorites are omitted. Sample metadata requests no indexing/following.

The shared examples are presentation-only source data with non-account identifiers and no contact destinations. No database/Auth records, invitations, reviews, quotes or notifications are created. The default directory and public vendor APIs retain their real-data behavior and all previously hidden test accounts remain hidden. Ads remain disabled.

The held native source has an explicit **development-preview-only** sample entry in vendor search. Its sample list/detail reads use the same shared data without calling the live API. Favorite, inquiry, call and content-report mutations are absent from these sample screens. The normal signed/production directory retains its existing behavior. This work does not publish an app update, signed binary or store release.

## Validation

- Architecture, web/native type checks and lint pass.
- Web production build and 94 web tests pass, including category-specific sample adapters and the bilingual disabled inquiry form.
- Native checks include 76 tests. Dependency compatibility uses the local Expo map because network access was disabled during that check; dependencies were unchanged.
- Android/iOS local Hermes export results and the exact website release receipt are recorded alongside this handoff after validation.
- Local HTTP confirms the sample directory renders; the in-app browser could not connect to the local server, so final browser verification uses the deployed normal site.

No authenticated customer workspace or customer records are needed for this review. Native installed-device visual acceptance for the new sample mode remains separate from bundle/test validation.

# Inbox entry repair

The owner reported that the inbox icon returned to the homepage. Opening the
couple listing `/account/inbox` reproduced the same signup/home bounce for the
verified administrator account that owns a vendor.

The inbox listing now has a route-specific entry check outside the couple layout.
Verified client accounts retain the existing client inbox, including an account
with both client and vendor eligibility. Vendor-only/admin-owned-vendor accounts
arrive at `/vendor/inbox`. Guests sign in with the inbox return path preserved.
Missing workspace access or a failed role check shows an availability state; it
does not grant client access or bounce through signup. The listing URL, unified
inbox workflows, private thread guards, actions, RLS and role/ownership data stay
unchanged. Header design is still awaiting selection among the three previews.

All 136 application tests pass, including four role-entry regressions. Architecture,
TypeScript, lint, build and live verification are recorded after final validation.

# Selected header A — messages first

The owner chose **Option A** from the signed-in header proposals. Desktop now keeps
public navigation, the language switch, the role-aware inbox link and a compact
avatar. Identity moves into the account popup. Couples find profile, favorites,
notifications and quote creation there; vendors retain their dashboard, business
profile, personal profile and vendor notifications. Sign-out behavior is unchanged.

Phones keep a visible inbox icon beside the existing menu control. Search remains
available inside the drawer. Unread notification activity appears on the avatar
and mobile menu, with its count in the notification row. The existing foreground,
in-flight and five-second refresh guards remain. Only one notification subscription
is mounted, and menu mode fetches the unread count without the old preview list.
The shared badge snapshot is scoped to the verified user ID.

The owner also reported that the profile form was still narrower than its photo
section. The inherited `.wm-editorial-form` 820px cap is now overridden only inside
the personal profile. The containing width is unchanged. The requested three new
profile styles are previews awaiting a separate selection, with no profile field,
Auth, RLS, native-release or database change.

Architecture, TypeScript, lint and the final production build pass. All 137
application tests pass, including bilingual client/vendor header checks for the
visible inbox, compact account control and preserved destinations. Application
**fad3e276f27292914cd0f332c48bdf3389b17c54** is verified live through its exact
[successful receipt](deployment-success.json) and all 32
[public checks](public-checks.json). Rollback is
`/var/www/wedding-market.before-20261030-144012`.

The owner's vendor/admin-owned-vendor session confirms a compact 60px avatar,
one top-level inbox link, no standalone notification trigger, and the vendor
dashboard/business profile/personal profile/notification destinations inside the
popup. Escape closes the menu and returns focus; clicking outside closes it.
The photo/form rectangles now both measure 1016px with identical edges, replacing
the inherited 820px form width. At 320px, both sections measure 281px, document
client/scroll widths match 305px, and the visible phone inbox opens `/vendor/inbox`.
The drawer retains search and account links. [Sanitized live measurements](live-verification.json).

No profile was saved, message sent, notification event generated or credential
changed for verification. Private screenshots remain in ignored cache. The
viewport override and profile-preview server are stopped/reset. The actual profile
tab remains open. The [three profile redesigns](../profile-design-options-2026-10-30/README.md)
are a new choice; the earlier header-A selection does not select profile A.

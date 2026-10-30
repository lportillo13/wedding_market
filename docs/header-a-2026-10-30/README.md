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
visible inbox, compact account control and preserved destinations. Deployment and
live verification are recorded after publication.

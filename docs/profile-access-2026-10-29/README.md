# Personal profile access repair

The owner could sign in but opening `/account/profile` returned to the homepage.
The verified account has an administrator profile and owns a vendor. The couple
workspace layout required `is_user`, rejected the administrator role and redirected
to `/signup`, which redirected authenticated accounts to `/`.

The personal profile route now lives in a separate route group, outside the
couple-only workspace layout. It verifies authentication and reads only the
caller's own existing profile through the normal session and RLS. Missing or
inaccessible profiles fail closed. Its navigation includes couple inbox/review
links only for client accounts. The couple layout, private workspace guards,
database policies, account role and vendor ownership are unchanged.

Vendor account menus now include **Personal profile / Perfil personal** separately
from the business profile. Explicit return destinations survive password and OAuth
login; ordinary login still chooses the account's default workspace. Default OAuth
login uses the existing allowlisted callback URL, without an additional query flag.

Validation: architecture, TypeScript, lint and production build pass; all **128
application tests** and **33 isolated PostgreSQL authorization/transaction tests**
pass. All **31 local HTTP checks** pass, including guest personal-profile
authentication and callback return paths. The Next.js generated route types were
regenerated after moving the page.
The sandbox denied writes to an existing build directory; the authorized build
outside the sandbox completed successfully. No production database writes or
customer profile edits were performed for validation.

Application **5ada784ab46122cc508ef7defd15ced480719db9** is verified live through
the fixed gateway's exact [successful receipt](deployment-success.json). Rollback
is `/var/www/wedding-market.before-20261030-035821`. All **31 public HTTP checks**
pass in [the report](public-checks.json), alongside [local checks](local-http-checks.json)
and [validation](validation.json).

The owner's existing signed-in ChatGPT browser session now opens
`/account/profile` and displays the personal form. The new **Perfil personal**
menu link was followed successfully from the vendor editor. `/vendor/profile`
still displays the existing business editor. Personal navigation omits the couple
inbox/review links for this administrator account. No real form was saved, no
credential was entered and no email was sent. The profile tab remains open for
the owner. Account screenshots stay in ignored local cache, outside this handoff.

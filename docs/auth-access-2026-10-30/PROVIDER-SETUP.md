# Provider activation handoff

No client secrets, signing keys, access tokens or raw authentication links belong
in this file or chat. Enter generated secrets directly in the provider dashboard.
Only Wedding Market is in scope; leave the separate DW app and other API scopes
unchanged.

## Google

The owner completed the Google API Services User Data Policy step in the
authenticated ChatGPT browser. The created website client is under the existing
**The Wedding Market** project (`the-wedding-market-a627b`):

| Setting | Configured value |
| --- | --- |
| Application type | Web application |
| Client name | Wedding Market website |
| JavaScript origin | `https://thewedmarket.com` |
| Authorized redirect URI | `https://aousexbvujjnvbudpsmz.supabase.co/auth/v1/callback` |
| Identity information | Email and basic profile only |

The owner explicitly approved credential creation and entered the new values
directly in Wedding Market's
[Google provider](https://supabase.com/dashboard/project/aousexbvujjnvbudpsmz/auth/providers?provider=Google).
Google is enabled, with nonce checks and the requirement for an email retained.
After the owner separately approved production publication, Google audience status
was verified **In production**. Additional sensitive Google API scopes are unnecessary.

## Apple

The Services ID and signing key are created in **PORTILLO'S DESIGN CR LLC**:

| Setting | Prepared value |
| --- | --- |
| Description | Wedding Market website |
| Services ID | `com.theweddingmarket.web` |
| Separate web authentication primary | `com.theweddingmarket.webauth` |
| Existing native bundle ID (unchanged) | `com.theweddingmarket.app` |
| Web return URL | `https://aousexbvujjnvbudpsmz.supabase.co/auth/v1/callback` |
| Return host | `aousexbvujjnvbudpsmz.supabase.co` |

The Services ID is associated with the separate web primary and its return host/URL
are saved. An attempted change to the native App ID was rejected before saving
because it would invalidate provisioning profiles; it was cancelled and replaced
with the isolated web primary. No native profiles were invalidated.

The owner must download the new Sign in with Apple `.p8` key once and preserve it
securely. The download screen is retained in the browser. A generated OAuth client
secret is also needed for web authentication. The owner must handle new
credentials securely and enter the Services ID/client secret directly in the
[Apple provider](https://supabase.com/dashboard/project/aousexbvujjnvbudpsmz/auth/providers?provider=Apple).
Keep the requirement for an email enabled. Generate the secret locally with:

```powershell
node scripts/create-apple-client-secret.mjs --key-file 'C:\path\to\downloaded-key.p8' --team-id TEAM_ID --key-id KEY_ID --client-id com.theweddingmarket.web
```

This writes `.cache/auth-access/apple-client-secret.txt` without printing its
contents, refuses to overwrite an existing file and reports the actual expiry.
Only the owner should paste its contents into Supabase's **Secret Key (for OAuth)**.
Do not paste the `.p8` contents or JWT into chat or commit either file. The helper
uses a verified ES256 signature and a 180-day expiry; rotate before that date.
This setup does not publish or release the native app.

Apple private-relay sender registration was explicitly approved and saved for
the existing auth sender/bounce domains. Public DNS checks show a valid DKIM public
key for `mail.thewedmarket.com` and SPF for `send.mail.thewedmarket.com`.
The source table confirms both registrations. No DNS changes were made. These
sources allow code emails to Apple Hide My Email addresses; actual delivery still
requires a real-user acceptance test.

## Final acceptance

Verify public provider flags, complete one real sign-in/signup per provider and
email-code delivery, check that an existing verified account is reused, and
verify a returning session. New identity creation or identity linking may require
the owner's participation; do not change customer roles or create disposable
customers in production just to get a green test.

Official references: [Google](https://supabase.com/docs/guides/auth/social-sign-in/auth-google),
[Apple](https://supabase.com/docs/guides/auth/social-sign-in/auth-apple),
[email codes](https://supabase.com/docs/guides/auth/auth-email-passwordless),
[server sessions](https://supabase.com/docs/guides/auth/server-side/creating-a-client).

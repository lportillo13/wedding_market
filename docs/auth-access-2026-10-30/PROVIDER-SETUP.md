# Provider activation handoff

No client secrets, signing keys, access tokens or raw authentication links belong
in this file or chat. Enter generated secrets directly in the provider dashboard.
Only Wedding Market is in scope; leave the separate DW app and other API scopes
unchanged.

## Google

The owner completed the Google API Services User Data Policy step in the
authenticated ChatGPT browser. The prepared client form is under the existing
**The Wedding Market** project (`the-wedding-market-a627b`):

| Setting | Prepared value |
| --- | --- |
| Application type | Web application |
| Client name | Wedding Market website |
| JavaScript origin | `https://thewedmarket.com` |
| Authorized redirect URI | `https://aousexbvujjnvbudpsmz.supabase.co/auth/v1/callback` |
| Identity information | OpenID, email and basic profile only |

Credential creation requires action-time confirmation under browser safety
rules. New authentication credentials must be entered by the owner. Create the
reviewed client, then enter its client ID and secret directly in Wedding Market's
[Google provider](https://supabase.com/dashboard/project/aousexbvujjnvbudpsmz/auth/providers?provider=Google)
and enable Google. Keep nonce checks and the requirement for an email enabled.
Check the Google audience/production status so access is not limited to testers;
additional sensitive Google API scopes are unnecessary.

## Apple

The Services ID review is prepared in **PORTILLO'S DESIGN CR LLC**:

| Setting | Prepared value |
| --- | --- |
| Description | Wedding Market website |
| Services ID | `com.theweddingmarket.web` |
| Existing native bundle ID | `com.theweddingmarket.app` |
| Web return URL | `https://aousexbvujjnvbudpsmz.supabase.co/auth/v1/callback` |
| Return host | `aousexbvujjnvbudpsmz.supabase.co` |

Register the reviewed Services ID, associate a Sign in with Apple primary App ID
and configure the return host/URL. A Sign in with Apple signing key and generated
OAuth client secret are needed for web authentication. The owner must handle new
credentials securely and enter the Services ID/client secret directly in the
[Apple provider](https://supabase.com/dashboard/project/aousexbvujjnvbudpsmz/auth/providers?provider=Apple).
Keep the requirement for an email enabled. Apple web client secrets expire after
six months; record the actual expiry securely when it is generated. This setup
does not publish or release the native app.

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

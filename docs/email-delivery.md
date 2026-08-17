# Wedding Market email delivery

Wedding Market uses Resend for every server-delivered email:

- Supabase Auth uses Resend SMTP for confirmations, password resets, magic links, and email changes.
- The Wedding Market server uses the Resend API for quote, request, acceptance, and conversation notifications.
- The footer newsletter form adds opted-in contacts to Resend. Broadcasts and unsubscribe management stay in Resend.

Mobile and browser clients never receive a Resend secret.

## 1. Verify the sending domain

In Resend, add `mail.thewedmarket.com`, copy every DNS record Resend provides into the authoritative DNS provider, and wait until the domain is verified.

Using a sending subdomain isolates email reputation from the website. The verified subdomain supports addresses such as:

- `accounts@mail.thewedmarket.com` for authentication
- `notifications@mail.thewedmarket.com` for application activity

## 2. Configure Supabase Auth SMTP

Create a Resend API key for Supabase SMTP. In Supabase, open **Authentication -> Emails -> SMTP Settings**, enable custom SMTP, and use:

```text
Sender name: Wedding Market
Sender email: accounts@mail.thewedmarket.com
Host: smtp.resend.com
Port: 465
Username: resend
Password: <the Resend SMTP API key>
```

Keep **Confirm Email** enabled. Under **Authentication -> Rate Limits**, set an email limit that fits the active Resend plan. Keep `theweddingmarket://auth/callback` in the allowed redirect URLs for the mobile app.

Password-recovery emails deliberately link to the website's
`/auth/confirm` endpoint instead of using Supabase's generated
`.ConfirmationURL`. The endpoint verifies the token hash, stores the recovery
session in secure cookies, and opens `/reset-password`. This keeps recovery
links usable in any browser even when the request originated in the mobile app.

## 3. Configure application email

Create a second Resend key with **Sending access**, restricted to `mail.thewedmarket.com`. Put it only in the server runtime environment:

```dotenv
RESEND_API_KEY=re_replace_me
RESEND_FROM_EMAIL="Wedding Market <notifications@mail.thewedmarket.com>"
# Optional: set only to a real mailbox that can receive replies.
RESEND_REPLY_TO=
```

The server retrieves the recipient address through the Supabase Admin API, so `SUPABASE_SERVICE_ROLE_KEY` must also be present. Email delivery is best-effort: quote and message workflows still complete if an email provider is temporarily unavailable. Resend idempotency keys prevent duplicate notification emails during retries.

## 4. Configure the newsletter

Create a third Resend key with **Full Access** for contact and Topic management. Keeping this separate means transactional delivery still uses a domain-restricted Sending key. Then create a public newsletter Topic whose **Default subscription** is **Opt-out**. The Wedding Market form explicitly opts in each person who submits it, while contacts added through another path remain unsubscribed by default. Copy the Topic ID into:

```dotenv
RESEND_CONTACTS_API_KEY=re_replace_me
RESEND_NEWSLETTER_TOPIC_ID=topic_replace_me
```

The footer form then creates or re-subscribes the contact and opts it into that Topic. Send marketing mail with Resend Broadcasts so Resend can apply the contact's unsubscribe preferences.

## 5. Deploy and verify

Hosted Supabase Auth does not read `supabase/config.toml` or automatically upload
the files in `supabase/templates` during an application deploy. Publish the
branded Auth templates separately whenever those files change:

```bash
export SUPABASE_ACCESS_TOKEN="<personal-access-token>"
export SUPABASE_PROJECT_REF="<project-ref>"
npm run email:deploy-auth
```

The command updates confirmation, password recovery, invite, magic-link, email
change, and reauthentication templates through the Supabase Management API. The
access token is only needed for this deployment command and must not be added to
the application runtime environment.

For local email previews, restart the local Supabase stack after changing a
template so Auth reloads `supabase/config.toml`:

```bash
npx supabase stop
npx supabase start
```

After updating `/var/www/wedding-market/deploy/.env`, deploy the `dev` branch:

```bash
/home/deploy/deploy-wm.sh --force
```

Verify these flows with separate client and vendor accounts:

1. Account confirmation arrives from `accounts@mail.thewedmarket.com`.
2. A multi-quote request sends one independent notification email to each selected vendor.
3. Each vendor reply emails only the client who owns that request.
4. A client reply emails only the vendor for that conversation.
5. Accepting a quote emails only the accepted vendor.
6. The footer newsletter form creates an opted-in Resend contact.

Application email results are reflected in the existing `notifications.email_status` and `notifications.email_sent_at` columns. No new database migration is required.

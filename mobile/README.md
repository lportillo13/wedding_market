# The Wedding Market Mobile

Expo React Native app for the full The Wedding Market platform.

## Local Backend

This app is designed to run against the existing local stack first:

- Supabase local API: `http://127.0.0.1:54321`
- Next.js API server: `http://127.0.0.1:3000`

For Android emulator networking, use `10.0.2.2` instead of `127.0.0.1`.

## Setup

1. Start local Supabase from the repository root.
2. Start the existing Next.js app from the repository root.
3. Copy `mobile/.env.example` to `mobile/.env`.
4. Put the local Supabase anon key in `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
5. Install mobile dependencies inside `mobile`.
6. Run the Expo app.

```powershell
cd C:\wedding-market\mobile
npm install
npm run start
```

## Build Order

The full platform will be built in this order:

1. Auth/session foundation with Supabase.
2. Customer vendor search and vendor profile screens.
3. Shortlist/favorites.
4. RFQ creation.
5. Client inbox, quotes, and replies.
6. Vendor request inbox and quote sending.
7. Vendor profile editor, media, availability, pricing, amenities, team, and reviews.
8. Notifications.
9. Admin operations.

## Backend Strategy

No new server is planned. The native app will reuse:

- Supabase database and auth.
- Existing Next.js API routes.
- Cloudflare R2 media handling through the current upload API.

Some Next server actions need mobile API route equivalents before the native app can use them.

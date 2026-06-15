# The Wedding Market Mobile

Expo React Native app for the full The Wedding Market platform.

## Environments

For local development, the app can run against the existing local stack:

- Supabase local API: `http://127.0.0.1:54321`
- Next.js API server: `http://127.0.0.1:3000`

For Android emulator networking, use `10.0.2.2` instead of `127.0.0.1`.

For Play Store builds, configure these values in the EAS production environment instead of shipping local URLs:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_WEB_URL`
- `EXPO_PUBLIC_WEB_API_URL`

## Setup

1. Start local Supabase from the repository root.
2. Start the existing Next.js app from the repository root.
3. Copy `mobile/.env.example` to `mobile/.env`.
4. Put the local Supabase anon key in `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
5. Install mobile dependencies inside `mobile`.
6. Build and install a development client on your Android device.
7. Start Metro for the development client.

```powershell
cd C:\wedding-market\mobile
npm install
npm run build:android:dev
npm run start
```

This project targets Expo SDK 56 and includes native modules used by the production app. Use a development build instead of Expo Go. If Expo Go shows "Project is incompatible with this version of Expo Go", install the Android development build from EAS and then run `npm run start`.

## Android Release Build

The production EAS profile builds an Android App Bundle (`.aab`) for Google Play:

```powershell
cd C:\wedding-market\mobile
npm run build:android:production
```

Before submitting, confirm the production EAS environment points to the deployed Supabase project and deployed Wedding Market web/API host.

## Implemented Mobile Surface

The mobile app currently includes:

1. Auth/session foundation with Supabase.
2. Customer vendor search and vendor profile screens.
3. Shortlist/favorites.
4. RFQ creation.
5. Client inbox, quotes, and replies.
6. Vendor request inbox and quote sending.
7. Vendor profile editor, media, availability, pricing, amenities, team, and reviews.
8. Notifications.
9. Admin operations overview.

## Backend Strategy

No new server is planned. The native app will reuse:

- Supabase database and auth.
- Existing Next.js API routes.
- Cloudflare R2 media handling through the current upload API.

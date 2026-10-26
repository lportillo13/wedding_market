# Apple App Store Launch Checklist

Last reviewed: October 26, 2026

Start with the [current launch preparation and blockers](mobile-launch-2026-10-26/README.md), including branding, self-service deletion, user-content safeguards, bilingual support, business-model notes and native build proof. The existing email-only deletion link is not a completed launch requirement. Run `npm run launch:audit` from `mobile`.

## Build

- Configure the EAS `production` environment with HTTPS values for:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_WEB_URL`
  - `EXPO_PUBLIC_WEB_API_URL`
- Run the local quality gate and create the remote iOS build:

```powershell
cd C:\wedding-market\mobile
npm run check
npm run build:ios:production
```

- Complete Apple signing and App Store Connect credentials in EAS.
- Test the release build on a physical iPhone and, where supported, an iPad.

## App Store Connect

- Add the deployed privacy policy URL (`/privacy`) and support URL.
- Complete App Privacy using the same data inventory as the Google Play Data Safety declaration.
- Provide review notes and isolated client/vendor test accounts for reviewable features; reviewers should not receive a production administrator login.
- Add screenshots for every required device size and complete the age rating, category, description, and keywords.
- Confirm account deletion is reachable in the app and at `/account-deletion`.
- Verify notification credentials and delivery in the production EAS build.

## Release Smoke Test

- Sign up, sign in, sign out, and restore a persisted session.
- Search and paginate vendors; open details, call, share, save, and open locations in Maps.
- Create an RFQ and exchange replies as both client and vendor.
- Upload vendor media and update the vendor profile.
- Open a notification from foreground, background, and terminated states.
- Verify English and Spanish, legal links, keyboard behavior, and VoiceOver labels on primary navigation.

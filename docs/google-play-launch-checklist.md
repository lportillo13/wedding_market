# Google Play Launch Checklist

Last updated: June 15, 2026

## Build

- Configure production EAS environment variables:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_WEB_URL`
  - `EXPO_PUBLIC_WEB_API_URL`
- Build the Android App Bundle:

```powershell
cd C:\wedding-market\mobile
eas build --platform android --profile production
```

- Verify the app on a real Android device before submitting to closed testing.

## Store Listing URLs

- Privacy policy: `/privacy`
- Terms: `/terms`
- Account deletion: `/account-deletion`

Use the deployed absolute URLs in Play Console, for example `https://your-domain.com/privacy`.

## Data Safety Draft

Declare collection for these data categories if enabled in production:

- Personal info: name, email, phone number, country, preferred language.
- App activity: saved vendors, quote requests, messages, reviews, notifications.
- User content: vendor descriptions, pricing details, team details, media uploads, quote messages.
- Photos and videos: user-selected profile and vendor media uploads.
- Device or other IDs: Expo push notification tokens and security/session identifiers.

Primary purposes:

- Account management.
- App functionality.
- User communication.
- Vendor profile management.
- Fraud prevention, security, and debugging.

Data deletion:

- In-app entry point: mobile profile account controls and account menu.
- Web request URL: `/account-deletion`.

## Android Permissions

Expected Android permissions:

- `INTERNET`
- `POST_NOTIFICATIONS`

`RECORD_AUDIO` is blocked in Expo config because the app only needs selected images for the current media upload flows.

## Play Console Before Public Launch

- Complete app access instructions with test account credentials for Google review.
- Complete Data Safety based on the production services actually enabled.
- Complete content rating.
- Complete target audience and ads declarations.
- Upload screenshots and feature graphic.
- Run required closed testing before production if the Play developer account requires it.
- Confirm the Android App Bundle targets the current Play target SDK requirement.

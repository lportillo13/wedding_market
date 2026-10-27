# Message and quote notifications

This change prepares opt-in native alerts for new messages, new/revised quotes, wedding requests and accepted quotes. It reuses Wedding Market's existing private inbox and notification events. It does not establish phone delivery or store availability until the remaining credential and installed-build checks below are completed.

## User behavior

- Couples and vendors can enable or disable alerts from their profile; the account menu links to Notifications. Login does not request OS permission automatically.
- Android creates the message/quote channel before requesting permission. English/Spanish alerts use the device registration's current app language and the approved WM notification mark.
- Alerts contain generic text and opaque notification/account/binding identifiers. Names, message contents, wedding details and quote prices stay inside the authenticated inbox.
- A tap resolves a recipient-owned notification and opens its specific RFQ/vendor thread. Unavailable, expired or other-account alerts cannot open private conversations. A cold-start tap waits for session restoration. Pending quote/recovery modals are preserved, and switching from a conversation with an unsent draft requires a choice.
- Disable/logout immediately clears presentation scope and dismisses displayed alerts. The server revokes the exact binding; failed opt-out retains retry metadata. OS services can still deliver already queued generic alerts. Push delivery is best effort; the saved inbox remains authoritative.

## Data and resource controls

Migration `202610260012_message_push_bindings.sql` adds random binding IDs, Auth-session ownership, language and expiry to the existing device table. Delivery joins a current unsuspended profile and an existing, unexpired Supabase Auth session. Bindings expire within 30 days and are renewed during active opted-in use. A token rebound to another account/session rotates its binding; stale revocation cannot remove the replacement.

Authenticated users cannot directly read/write tokens or enumerate another account's bindings. Registration/revocation use scoped functions; delivery lookup is server-only. Registration serializes per account and retains at most ten active devices. One event sends one packet of at most ten deduplicated tokens. Immediate `DeviceNotRegistered` errors retire only the same recipient/token/binding. HTTP/body time and byte limits bound provider work; errors do not remove the durable inbox notification or trigger automatic send retries.

The native workflow serializes device operations, cancels stale presentation, bounds duplicate memory to 100 IDs, caches successful registration for up to 12 hours for the same access-token hash/language, and backs off automatic failures for one minute. Token refreshes and foreground wakeups can renew the registration. No new background poller, database subscription, worker, server or paid Firebase product was added. Existing foreground inbox refresh limits remain in place.

Only device preference/binding metadata is stored in SecureStore; no access token is copied into that record. Existing Supabase session persistence remains AsyncStorage and still needs the broader native storage/privacy acceptance recorded in the launch checklist. Android backup is disabled in configuration; verify the generated binary manifest.

## Verified preparation

- Disposable PostgreSQL authorization/transaction suite: 33 tests, including account/session ownership, private token access, idempotent registration, safe rebinding/revocation, session deletion/expiry, suspension and ten-device cap.
- Root suite: 84 tests; native suite: 55 tests. Native checks include delayed registration during account switch, failed secure save, retryable disable, cold-start/duplicate taps, and account switch during notification lookup. Type/lint/architecture checks pass.
- Live migration receipt confirms normalized source MD5 `bbd8add2719b49a2b2fbd0fe642f5d2d`; no existing push rows were present. Public/anonymous registration, authenticated direct token reads and authenticated binding enumeration are denied. Live catalog comparison matches 355 columns, 91 constraints, 80 indexes, 113 policies, 55 functions and eight views.
- Firebase project **The Wedding Market**, ID `the-wedding-market-a627b`, number `106157231077`, uses the no-cost Spark plan. Analytics and Gemini were declined. Android package `com.theweddingmarket.app` is registered as app `1:106157231077:android:6789e14b8dc1d026793d0c`; FCM v1 is enabled. No Firebase database/storage/hosting service was provisioned. Digital Wedding was not changed.
- Missing production EAS public API/Supabase values were created from the verified same-project preview configuration. Public keys were validated without printing values. No private service key is in source or the native archive.
- Android/iOS Hermes exports use verified HTTPS Wedding Market public build values; each bundle is approximately 2.9 MB. Actual EAS25.2 source archives both pass: 99 files / 1,084,141 bytes, identical fingerprint `2a58e13929c6dd77339a3fd555638ed9135183d184e1fdf86d69b4951681839b`, with no missing, extra, changed or sensitive files. See [Android archive](source-archive-android.json), [iOS archive](source-archive-ios.json), [migration receipt](database-receipt.json) and [schema comparison](schema-comparison.json). Backend release evidence will be retained alongside this handoff after deployment.

## Remaining delivery gates

1. Save the public Android client `google-services.json` and configure EAS project file variable `WM_ANDROID_GOOGLE_SERVICES_FILE` for preview/production. Dynamic config rejects a foreign project/package or a file containing a private key; remote Android builds fail early if this is missing.
2. With the owner's action-time confirmation, create `wm-expo-push@the-wedding-market-a627b.iam.gserviceaccount.com`, grant only the Firebase Cloud Messaging API Admin role in this Wedding Market project, and store its private FCM v1 JSON only in Wedding Market's EAS Android credentials. The prepared form has not been submitted; no private key has been generated. The browser download bridge did not expose the public client file, so the owner was asked to save it locally. Never put a private key in app config, source, an archive, documentation or chat.
3. Verify Wedding Market's Apple signing/APNs credentials, without revoking or modifying Digital Wedding's credentials. Configure Expo enhanced push security deliberately if used; its server access token remains server-only.
4. Build and install matching Android/iOS artifacts. Test both roles/languages with isolated accounts: permission grant/deny, foreground/background/terminated alerts, correct thread/older off-page thread, duplicate delivery, unsent drafts, logout/account switch, device permission changes, invalid token retirement, and offline recovery. Inspect actual icon/sound/channel/privacy behavior. An accepted Expo ticket is not proof of phone delivery; inspect delivery receipts and the device.

No signed cloud build, store upload, publication or physical-device notification acceptance has been performed by this change. The separate owner-only build-retention dry run is still awaiting owner output; no cleanup timer is claimed active.

References: [Expo notifications](https://docs.expo.dev/versions/v56.0.0/sdk/notifications/), [FCM credentials for Expo](https://docs.expo.dev/push-notifications/fcm-credentials/), [Firebase Cloud Messaging roles](https://docs.cloud.google.com/iam/docs/roles-permissions/firebasecloudmessaging).

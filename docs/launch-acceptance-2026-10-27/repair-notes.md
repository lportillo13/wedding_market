# Acceptance findings and repairs

The second actual iPhone capture job compiled and launched with Expo SDK57's supported Xcode image. Its diagnostic image exposed a header overlapping the iPhone status/camera area. The deprecated React Native safe-area component was replaced with SDK57's compatible `react-native-safe-area-context` provider and native views. Absolute header/tab positioning now belongs to an inset content frame. Full-screen authentication and license modals have their own safe-area providers.

The Android6 acceptance flow showed the account menu visually, but its language and account actions were missing from the native accessibility hierarchy. Its absolute popup was outside the small header ancestor's bounds. The popup now sits in a full-screen overlay within the safe-area frame, with outside-tap dismissal, explicit accessible language names and stable native-test identifiers. The menu layout and destinations are preserved. Installed-build verification is still required.

A fresh owner-controlled signup reproduced a production callback redirect to `https://localhost:3001/login`. A token-free public GET independently reproduced the same307 Location header. Both email callback routes now derive their destination from the configured public site origin, rather than Next's internal request origin. Recovery and callback error redirects use the same rule. Regression checks cover valid destinations, external URLs, backslashes and URL-normalized control characters. The disposable account's exposed refresh sessions were revoked; no raw link/token is retained here.

The owner completed administrator MFA. The single explicitly labeled fictional report was reviewed and dismissed using the normal moderator UI. The queue then showed no open reports; no customer report, message or account was removed. The account-deletion queue was empty before creating a separate disposable acceptance account. Store-review logins remain intact.

Daily media backup succeeded on October27 and its encrypted export was copied off-host and SHA256-verified. The current receipt still says no database dump or full restore test. The audit identity intentionally cannot install root helpers or read production configuration; preserve that boundary.

The current Android6/iOS5 signed candidates do not contain these native repairs. Replacement signed artifacts and final native captures remain pending. No public store submission has occurred.

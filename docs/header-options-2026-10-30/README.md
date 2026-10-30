# Signed-in header options

The owner reported that the authenticated header was crowded and requested three
visual alternatives. These are previews, with no selected or deployed header change.
They use the existing supplied fonts, wordmark, warm palette and public sections.

- **A — Messages first (recommended):** keep public navigation, language, the inbox
  icon and a compact avatar. Move favorites, notifications and the quote action
  inside the account menu; show the account name in that menu.
- **B — One account menu:** keep public navigation and language, with a single
  account button containing all personal activity. Messages and favorites lead
  the popup, followed by quotes, notifications, profile and sign-out.
- **C — Explore dropdown:** group the existing public links under Explore; retain
  the quote action, messages and compact avatar in the header.

[A](option-a.jpg), [B](option-b.jpg), [C](option-c.jpg) are 1280×720 code-rendered
desktop proposals. The account menu is open in A/B; the Explore menu is open in C.
Prototype source is in ignored local `.cache/header-options/server.cjs`. Its
temporary preview server is stopped after delivery. Future implementation must
preserve role-aware client/vendor destinations, unread activity and both languages;
vendor wording/actions must reflect their business workspace. Native release stays held.

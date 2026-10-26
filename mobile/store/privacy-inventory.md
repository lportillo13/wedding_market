# Privacy and support inventory — draft, October 26, 2026

This is an engineering inventory, not completed Apple App Privacy or Google Data safety declarations. Confirm legal publisher, support inbox, retention/deletion periods, processor agreements, actual native SDK behavior, and owner declarations before submission. The existing pages use `hello@weddingmarket.com`; its ownership and delivery were not established. Do not assume Digital Wedding's publisher and contacts apply here.

| Data in current workflows | Purpose and handling to verify |
| --- | --- |
| Name, email, phone, contact country, language, role | Account/profile management. Contact country is the client's country, not wedding destination or device geolocation. Contacts are selectively disclosed by vendor-thread consent. |
| Wedding date, guests, optional budget/theme | Planning and quote prefilling. Requests and vendor responses can contain additional personal information. |
| Auth/session identifiers | Supabase authentication; native session currently persists through AsyncStorage. Review encrypted session storage, Android backup rules, and device recovery before release. Do not report encryption at rest based only on HTTPS. |
| Saved providers, quote requests, private messages and proposals | Core app activity; disclose actual sharing with invited providers rather than making a blanket no-sharing claim. Group conversations remain private per provider. |
| Vendor details, prices, availability, team, reviews | Profile management; some information is public. Check publication/consent controls and deletion dependencies. |
| User-selected profile and vendor images | Uploads via Wedding Market API to object storage. No need to declare device-wide photo-library collection merely because a picker is used. Verify final permission prompts and metadata handling. Current picker flows select images; audit final native permissions for unused audio/video access. |
| Expo push tokens, device platform, notification payloads | Delivery through Expo/APNs/FCM and Wedding Market API. Verify credentials, consent, logout/revocation, retention, and payload contents on real devices. Notification body text can expose message content on lock screens. |
| Server logs, IP addresses, security events | Operations/security. Confirm actual logged fields, access and retention rather than assuming generic diagnostics categories. |

Known providers include Supabase, Cloudflare R2, Expo push services, the Wedding Market host, and Resend for auth/application email. Check each against production configuration. No native tracking or analytics integration was established by this review; absence of a direct dependency does not establish absence of SDK collection. The public advertisements switch remains off. Do not add ATT prompts or make tracking declarations without evidence of tracking.

## Account deletion and user content

The app currently opens `/account-deletion`, whose only action composes an email request. Implement an authenticated, confirmed self-service deletion or deletion-initiation flow that actually performs or queues deletion and gives status/timing. Verify dependent media, push tokens, sessions, messages, vendor records, and legitimate retention needs. Do not silently break other users' booking or conversation history. Test only with isolated records. [Apple's deletion guidance](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion) says ordinary apps should not require a support email to complete deletion.

Messages, reviews and vendor uploads require content safeguards. No native report/block flow was found in this review. Define filtering, reporting, response handling, user blocking and visible support contact, then test server enforcement as well as the buttons. See [Apple guideline 1.2](https://developer.apple.com/app-store/review/guidelines/#user-generated-content). Do not treat inbox archive/delete as blocking a person.

## Public page verification

On October 26, independent HTTPS requests returned 200 for `https://thewedmarket.com/privacy`, `/terms`, and `/account-deletion`; `/support` returned 404. These are reachability checks, not content/translation approval. The three source pages are English-only. Add an owned support destination, confirm a monitored email address, and finish EN/ES privacy, support, terms and deletion text. Publish factual pages through the normal Wedding Market release gateway after their application implementation is ready; a mobile build does not publish them.

# Interactive boutique examples

The owner requested example boutiques to test the visual design and all the main interactions. Open `/boutiques?examples=1`, or use **View example boutiques** in the normal Dresses & suits directory. The examples include:

- **Atelier Alba**: a satin gown and charcoal suit, purchase/rental, and a short photo-presentation video.
- **Casa Marfil**: a lace gown and a satin rental gown.
- **Sastrería Roble**: a navy tuxedo and charcoal rental suit.

All names, locations, sample collections, sizes and prices are fictional. Photos were generated for this preview; provenance and delivery hashes are in [example-assets.json](example-assets.json). The video is explicitly described as a still-photo presentation. No real boutique identity, contact destination, account, review or verification claim was invented.

## Trying both sides

1. Choose **Try as couple**, open a boutique, filter dresses/suits, view an outfit, and save it with the heart. Saved outfits link back to their detail pages.
2. Choose **Request a try-on**, enter a future date/time in Costa Rica, review policies, and submit. The example request starts as **Awaiting store confirmation**.
3. Open **Fitting appointments**, choose **Try as boutique**, and select the matching store. Open the request, confirm or decline it, and send a message. An overlapping confirmation is rejected.
4. Choose **Try as couple** again to see the decision and reply or cancel. Store selection isolates each boutique's inbox.
5. In boutique mode, **Boutique collection** edits visit settings and outfits, adds items using the sample media library, and controls publication. **Reset preview** clears the session.

The preview reuses the actual web/native storefront, favorites, appointment and manager components. Its injected transport is an in-memory session with no database, HTTP writes, emails or notifications. Website changes survive navigation within `/boutiques` and reset on reload. Native changes reset on leaving the preview. Exiting examples restores the authenticated production transport. Actual stores and private account screens continue using Supabase authorization and the tested database transactions.

The normal directory and catalog API contain only real published vendor records. Example routes and the example query are marked noindex. No database seed or migration was added for this preview. This simulation supports product review; it does not replace the real PostgreSQL/live rollback tests documented in the feature handoff.

## Validation

The production web build, architecture check, TypeScript, lint and 109 web tests pass. Five preview regression tests cover catalog/media, favorite navigation/reset, both roles and store isolation, retry safety, confirmation overlap, immutable snapshots, publication and stable media selection. The existing 47 database checks pass. Native checks pass (78 tests / 18 suites), with Android/iOS Hermes bundle exports; native publication remains held.

Interactive browser checks exercised favorite → saved detail → fitting request → store confirmation → messages in both directions → outfit edit and boutique selection → reset. English at 390px and Spanish at 320px have no horizontal overflow; sample photos load and the supplied GT Super display font is used. Screenshots alongside this file record the local review, and live release evidence is recorded after deployment. No physical-device acceptance or real two-account browser submission is claimed.

## Field research

The field structure distinguishes sample sizes from available order sizes and asks the boutique to confirm sample availability and wedding-date preparation time. This follows the designer's guidance on checking specific gowns and discussing the visit/timeline with an authorized boutique. [Maggie Sottero shopping guidance](https://www.maggiesottero.com/blog/wedding-dress-shopping-tips/), [designer FAQ](https://www.maggiesottero.com/faq/).

Suit/tuxedo details distinguish rental/purchase, fit, lapels and included pieces. Fitting remains a separate visit from reserving or purchasing the garment. [Men's Wearhouse rental FAQ](https://www.menswearhouse.com/rental/slc/faq).

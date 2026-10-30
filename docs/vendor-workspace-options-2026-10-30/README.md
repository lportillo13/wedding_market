# Vendor workspace redesign options

The owner requested three options to make the vendor backend easier to navigate
and control. These proposals address the vendor's own workspace, not the private
platform-moderation console. No vendor redesign has been selected or deployed.

The current workspace has six top-level tabs, a separate boutique link, eight
profile sections, a profile-completion strip and section-specific save controls.
The main problem is the hierarchy and split information: contact/location and
services/categories/prices occupy different destinations. The proposals keep
Wedding Market's approved header structure, GT Super/Acumin fonts and warm
ivory/champagne/brown identity. The previews show fictional photography-business
data and focus on the editor where information density is highest.

| Option | Navigation and editing | Best fit | Tradeoff |
| --- | --- | --- | --- |
| **A — Business studio (recommended)** | Persistent grouped sidebar: Home, Inbox, My business and Calendar. The active business section opens beneath My business. One edit surface, one save bar and a compact next-action/checklist panel. | Vendors who return regularly and need to jump directly to a task. | More visible navigation than the guided approach; collapse optional details and use a compact section menu on phones. |
| **B — Guided chapters** | Simple top navigation with a five-section profile route: business, photos/cover, services/prices, contact/location, publication review. Each section has one main Save and continue action; completed or earlier chapters remain directly accessible. | First-time vendors who need a clear starting point and fewer decisions at once. | Slower for frequent edits across unrelated sections. The guide must never force repeat setup or treat optional information as mandatory. |
| **C — Visual profile builder** | Operational navigation remains separate. A public-profile preview occupies the main canvas; selecting a section reveals only its controls in the inspector. Save state and listing state remain explicit. | Vendors who think visually and want to see how their content will appear. | More interface and implementation complexity. On phones, toggle between Preview and Edit instead of squeezing two columns together. |

All three concepts cover the full workspace rather than replacing it with only a
profile form. Proposed information grouping:

| Area | Existing tools/content retained |
| --- | --- |
| Home | Useful next actions, unresolved conversations, listing state and profile suggestions based on saved information. No invented views/revenue/conversion analytics. |
| Inbox | The existing unified inquiry/proposal/conversation flow, with its privacy, status, archive/delete, retry and independent-booking rules. Do not split it back into duplicate Requests and Quotes destinations. |
| Business presentation | Business name, profile address, bilingual descriptions and additional information. Keep content translation separate from the site's interface-language control. |
| Photos and video | Cover presentation, directory thumbnail and gallery/media management, with current upload limits and ownership. |
| Services and prices | Service categories, category-appropriate amenities, packages, currencies and price/contact-for-quote behavior. Avoid venue fields for photographers. |
| Contact and location | Existing public contact fields, map, address and service location, combined into one understandable group. |
| Calendar | Existing vendor availability, without implying payment processing or an external calendar integration. |
| More details | Team, reviews and optional information; keep review eligibility and account/contact restrictions intact. |
| Publication | Persistent draft/published state, a clear preview action and the existing separate publication review/requirements. Completion suggestions are not new mandatory publishing rules. |

Common UX improvements proposed: fewer competing navigation layers; labeled,
category-relevant fields; optional sections collapsed initially; an always-easy-to-
find save action and clear unsaved/saving/saved/error feedback; retained drafts
when switching sections; leave-page protection; focus/error handling; and large
phone controls. Boutique-only tools should appear only for relevant vendors.
Personal-account settings and notifications remain in the existing account menu.

[A](option-a.jpg), [B](option-b.jpg) and [C](option-c.jpg) are code-rendered concept
images with fictional data. Buttons illustrate proposed workflows; these are not
fully wired replacement applications. Desktop layouts were inspected at
1280×720 for readable grouping and non-overlapping save/publication controls.
The mobile behavior is part of the proposed design, not a released native change.

The [prototype source](prototype.cjs) runs from the repository root after
`npm run test:build`, using the existing shared HeaderIcon component and public
fonts/images. It serves `/A`, `/B`, `/C` locally on port 3246. No external account,
customer record, publication or upload is used. The temporary preview server is
stopped after delivery. The separate dropdown correction is already deployed;
its [release evidence](../dropdown-fix-2026-10-30/README.md) is independent of this
pending design choice.

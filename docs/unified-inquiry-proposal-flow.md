# Unified Inquiry And Proposal Flow

## Goal

Replace the current split between:

- `My requests`
- `Quotes received`
- `Received requests`
- `Quotes sent`

with one clear workspace per role that feels like a professional marketplace inbox.

The product should feel like:

- one conversation per vendor
- one event brief at the top
- one latest proposal card inside the thread
- one clear status at every moment

Do not merge request data and proposal data into the same record. Merge them in the UX.

## Recommended Product Language

Use these names consistently:

- `Inquiry` = the couple's event brief
- `Proposal` = the vendor's price/offer
- `Thread` = the shared conversation between one couple and one vendor
- `Inbox` = the main workspace page

Avoid showing both `request` and `quote` as top-level tabs.

## Information Architecture

### Couple Side

- Top-level nav: `Inbox`
- Secondary list item label: `Inquiries`
- Detail page title: vendor name

Inside each thread show:

1. Inquiry summary
2. Latest proposal
3. Message timeline
4. Actions

Primary actions:

- Send message
- Accept proposal
- Compare with other vendors
- Close thread

### Vendor Side

- Top-level nav: `Inbox`
- Secondary list item label: `Leads`
- Detail page title: couple name or inquiry title

Inside each thread show:

1. Inquiry summary
2. Latest proposal
3. Message timeline
4. Actions

Primary actions:

- Ask question
- Send proposal
- Revise proposal
- Decline lead

## Core UX Model

### Top Level

One inquiry can fan out to multiple vendor threads.

- Inquiry = shared event brief
- Thread = one inquiry + one vendor
- Proposal = the vendor's current offer inside that thread

This preserves comparison across vendors while removing the UX split between requests and quotes.

### Thread Detail Layout

Use the same layout on both sides with role-specific actions.

#### Sticky Header

- Thread status badge
- Vendor name or couple name
- Last activity
- Quick actions

#### Inquiry Summary Card

- Event date
- Flexibility
- Guest count
- Budget
- Location
- Theme/style
- Notes

This card stays visible and is never confused with the proposal.

#### Latest Proposal Card

- Proposal status
- Price or price range
- What is included
- Availability note
- Expiration date
- Deposit / next step if available
- `Accept proposal` action for couple
- `Revise proposal` action for vendor

Show `Previous versions` as a collapsible history under the latest proposal.

#### Timeline

Single chronological feed containing:

- system events
- vendor messages
- couple messages
- proposal sent
- proposal revised
- proposal accepted
- thread closed

This replaces separate conversation blocks and detached quote cards.

## Status Model

Use one shared thread status model:

- `new`
- `waiting_on_vendor`
- `proposal_sent`
- `in_discussion`
- `accepted`
- `declined`
- `closed`
- `expired`

Optional vendor-only internal state:

- `viewed`

Rules:

- new inquiry -> `new`
- vendor opens but has not replied -> `waiting_on_vendor`
- vendor sends first proposal -> `proposal_sent`
- either side replies after proposal -> `in_discussion`
- couple accepts -> `accepted`
- vendor declines -> `declined`
- couple closes without booking -> `closed`
- response window ends -> `expired`

Do not expose multiple competing status systems across RFQs, invites, and quotes.

## Data Model Direction

### Keep

- `rfqs` as the inquiry/event brief
- `rfq_invites` as the vendor thread link
- `quotes` as proposal versions

### Change Meaning

- Treat `rfq_invites` as the thread record
- Treat `quotes` as append-only proposal versions
- Stop updating the same quote row in place

This fits the existing schema because `quotes.version` already exists.

### Recommended Ownership

- `rfqs`: inquiry-level data
- `rfq_invites`: thread-level status, unread state, reveal flags, closed reason
- `quotes`: structured proposal revisions
- `quote_messages`: thread messages, ideally migrated later to point to `rfq_id + vendor_id` or `invite/thread id`

## Proposed Routes

### Couple

- `/account/inbox`
- `/account/inbox/[threadId]`

### Vendor

- `/vendor/inbox`
- `/vendor/inbox/[threadId]`

### Transitional Redirects

Keep these temporarily and redirect:

- `/account/rfqs`
- `/account/quotes`
- `/vendor/rfqs`
- `/vendor/quotes`

## What The New Pages Should Replace

### Replace On Couple Side

- current request list
- current quotes list
- current request detail page

with:

- one inbox list page
- one unified thread detail page

### Replace On Vendor Side

- current received requests page
- current sent quotes page

with:

- one inbox list page
- one unified lead detail page

## Component Structure

Create shared primitives:

- `ThreadList`
- `ThreadListItem`
- `ThreadHeader`
- `InquirySummaryCard`
- `ProposalCard`
- `ProposalHistory`
- `ThreadTimeline`
- `ThreadComposer`
- `AcceptProposalPanel`

Role-specific wrappers:

- `ClientInboxView`
- `VendorInboxView`
- `ClientThreadActions`
- `VendorThreadActions`

## Proposal Structure

The proposal form should move beyond:

- amount
- message

Recommended fields:

- price mode: fixed, starting_at, range, custom
- amount_min
- amount_max
- currency
- summary
- included_items
- exclusions
- availability_note
- valid_until
- next_step

Phase 1 can still render a simple form, but the data model and UI should be ready for richer proposals.

## Notifications

Notify on:

- new inquiry
- inquiry viewed
- new proposal
- proposal revised
- new message
- proposal accepted
- thread closed

Unread state should live on the thread, not only in a separate notifications page.

## Migration Plan

### Phase 1: UX Unification Without Risky Data Migration

- add new inbox routes
- build unified thread detail page using current `rfqs`, `rfq_invites`, `quotes`, and `quote_messages`
- show latest quote as `Latest proposal`
- keep existing tables
- redirect old pages to new inbox pages

### Phase 2: Status Cleanup

- standardize invite/thread statuses
- add unread markers and last activity
- add viewed state
- add thread close reasons

### Phase 3: Proposal Revisions

- stop updating quote rows in place
- insert a new `quotes` row for each revision
- use `version` consistently
- show proposal history in UI

### Phase 4: Thread-Centric Messages

- move messages from quote-bound to thread-bound
- preserve proposal events in the timeline
- keep latest proposal separate from free-form chat

## First Implementation Target In This Repo

Start here:

1. Build `/account/inbox` and `/vendor/inbox`
2. Build one unified thread detail page per role
3. Reuse current RFQ summary and quote conversation data
4. Rename `quote` UI labels to `proposal`
5. Hide old top-level split navigation

This gives the user the unified experience first, before deeper schema refactors.

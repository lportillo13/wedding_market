# Shared product rules

Pure TypeScript shared by the Next.js website and Expo app. Keep dependencies inside this directory; do not read environment variables or import React, Next.js, Supabase clients, native modules or Node APIs.

- `calendar/`: date-only parsing/formatting; callers choose their display format.
- `conversations/`: per-vendor conversation state, including acceptance and expiry.
- `notifications/`: event payload contracts and parsers.
- `proposals/`: exact quote amount parsing, PostgreSQL integer limit and display formatting.
- `vendors/`: service-category rules, profile progress, pricing validation and EN/ES labels.

The four older top-level vendor files are compatibility re-exports. Native Metro watches this directory, and the EAS source allowlist must include all of it. Database RPCs and constraints recheck the rules at commit time; client validation does not grant authority.

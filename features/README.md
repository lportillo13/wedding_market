# Web application features

Business workflows live with their feature: inquiries, conversations, proposals, notifications, vendors and media. `app/` keeps Next.js routes, server actions, route-local form composition and cache invalidation. `components/` keeps reusable web presentation. `lib/` keeps platform integrations, authentication, storage, configuration and compatibility exports.

- `server/` owns authenticated data access and operations. Preserve the caller's RLS session; privileged credentials are restricted to explicit administrative/infrastructure paths.
- `client/` owns browser transports/hooks. Public HTTP fetch helpers belong here, even when the API they call is implemented on the server.
- `domain/` owns web-specific validation. Cross-platform product rules belong in `shared/` and must not import Next.js, React, native SDKs or server integrations.
- Existing `lib` exports remain compatibility entry points. New callers should import the maintained feature/shared implementation directly; do not add a second implementation to a compatibility file.

`npm run architecture:check` detects dependency cycles and browser/native/shared boundary violations. Next.js server actions remain explicit client/server transport boundaries. This is a maintenance check; PostgreSQL authorization remains authoritative.

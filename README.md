# The Wedding Market

Bilingual wedding-vendor marketplace for weddings in Costa Rica, with a Next.js website, Expo iOS/Android app, and a shared Supabase backend. Read [project context](docs/project-context.md), [the architecture review](docs/architecture-2026-10-26/README.md), and [mobile launch preparation](docs/mobile-launch-2026-10-26/README.md) before making structural or release changes.

## Repository structure

| Directory | Responsibility |
| --- | --- |
| `app/` | Next.js pages, transport routes, server actions and route-local web forms |
| `features/` | Web business workflows and feature-specific server/client modules |
| `components/`, `styles/` | Reusable web UI and presentation |
| `lib/` | Authentication/platform integrations and compatibility imports |
| `shared/` | Pure product rules and contracts used by web and native |
| `mobile/src/application/` | Native application state, navigation and screen composition |
| `mobile/src/features/` | Native feature screens/components |
| `mobile/src/{ui,theme,i18n,content}/` | UI primitives, feature styles, translations and static content |
| `supabase/migrations/` | The single versioned database migration chain |
| `supabase/legacy/` | Historical SQL fragments; not an installation path |
| `scripts/database/` | Read-only schema export, disposable replay and drift checks |
| `deploy/remediation/` | Reviewed, restricted deployment gateway and rollback procedure |

## Getting Started

### Prerequisites
- Node.js 22.x (use `.nvmrc`; supported Node 24 also passes validation)
- npm (or pnpm/yarn)

### 1) Environment variables
Copy the template and fill values:
```bash
cp .env.local.example .env.local
```
Required vars:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key (public)
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_KEY`: Supabase service key (server-only)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps JavaScript API key
- `GOOGLE_PLACES_API_KEY` (optional): Server-side Google Places API key used to sync Google Business reviews. Falls back to
  the public Maps key when omitted.

> **Never commit** `.env.local`. Rotate keys if a secret is ever exposed.

### 2) Install & run (dev)
```bash
npm install
npm run dev
```
App runs at http://localhost:3000. Start the optional local Supabase stack explicitly with `npm run db:start`; production startup does not start Docker or a local database.

### 3) Build & start (prod)

For the shared production host, follow [the reviewed deployment procedure](deploy/remediation/README.md). It builds a separate standalone release and copies its public/static assets and private environment. The following commands are for an ordinary local production-mode check:
```bash
npm run build
npm start
```

### 4) Useful scripts
- `npm run typecheck` — TypeScript check (no emit)
- `npm run lint` — Next/ESLint
- `npm run build` — Production build
- `npm run architecture:check` — feature/shared/client boundaries, cycles and native module size
- `npm run db:inspect` — replay all migrations locally and inspect structure without contacting production
- `npm run test:database` — PostgreSQL authorization/atomic-workflow regressions with isolated fixtures
- `npm run test:tooling` — schema comparison, TLS policy and launch-audit regressions
- `npm run schema:supabase [outputPath]` — export the Supabase schema to `schema/supabase-schema.json` (or a custom path)

#### Supabase schema export
The maintained exporter uses PostgreSQL catalog queries in a read-only transaction. Configure a private database connection before running it:

1. Store your Supabase credentials in `.env.local` (or `.env`) in the project root:

   ```bash
   SUPABASE_DB_URL="<private PostgreSQL connection URI>"
   # Optional trusted provider certificate; remote TLS verification is always enabled.
   SUPABASE_DB_CA_FILE="<path to provider CA certificate>"
   # Optional: restrict schemas (comma separated). Defaults to `public`.
   SUPABASE_SCHEMAS="public,storage"
   ```

   The exporter automatically loads `.env.local`/`.env` when you run it from the repository root. If you keep the variables elsewhere, export them in your shell before running the command.

2. Generate the snapshot:

   ```bash
   npm run schema:supabase
   # or choose a destination file
   npm run schema:supabase -- schema/latest.json
   ```

   > Tip: to preload an alternate env file, you can use [`dotenv-cli`](https://github.com/entropitor/dotenv-cli): `npx dotenv-cli -e <file> -- npm run schema:supabase`.

The script writes a JSON description of tables, columns, constraints, and indexes for the selected schemas. Never commit connection credentials. For the full policy/function/view comparison and the distinction between the recovered baseline and production migrations, see [database guidance](supabase/README.md).


Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

Preserve the approved wedding styling and navigation structure when changing presentation. New business rules should be added to the appropriate feature or shared module.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

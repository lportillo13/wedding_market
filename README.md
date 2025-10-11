This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Prerequisites
- Node.js 20.x (use \`.nvmrc\`)
- npm (or pnpm/yarn)

### 1) Environment variables
Copy the template and fill values:
\`\`\`bash
cp .env.local.example .env.local
\`\`\`
Required vars:
- \`NEXT_PUBLIC_SUPABASE_URL\`: Supabase project URL
- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`: Supabase anon key (public)
- \`SUPABASE_SERVICE_ROLE_KEY\`: Supabase service key (server-only)
- \`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY\`: Google Maps JavaScript API key

> **Never commit** \`.env.local\`. Rotate keys if a secret is ever exposed.

### 2) Install & run (dev)
\`\`\`bash
npm install
npm run dev
\`\`\`
App runs at http://localhost:3000

### 3) Build & start (prod)
\`\`\`bash
npm run build
npm start
\`\`\`

### 4) Useful scripts
- \`npm run typecheck\` — TypeScript check (no emit)
- \`npm run lint\` — Next/ESLint
- \`npm run build\` — Production build


Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

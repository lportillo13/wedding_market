const ACTIONS = [
  {
    title: "Purge image cache",
    description:
      "Refreshes CDN copies of hero and gallery images. Useful after updating assets from Cloudinary or Supabase storage.",
    command: "npx supabase functions invoke purge-image-cache",
  },
  {
    title: "Rebuild marketing pages",
    description: "Run the Next.js static regeneration pipeline so public pages reflect the latest content settings.",
    command: "npm run build && npm run start",
  },
  {
    title: "Export vendor directory",
    description: "Downloads a CSV snapshot of all active vendor profiles for offline review or backup.",
    command: "./scripts/export-vendors.mjs",
  },
];

export default function OperationsPanel() {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 shadow-xl shadow-slate-900/20">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Operations</p>
          <h2 className="text-2xl font-semibold text-white">Runbook quick actions</h2>
        </div>
        <p className="max-w-lg text-sm text-slate-400">
          Use these reminders when performing maintenance or support tasks. All commands execute from the project root in a
          secure environment.
        </p>
      </header>

      <ul className="grid gap-4">
        {ACTIONS.map((action) => (
          <li key={action.title} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-6">
            <h3 className="text-lg font-semibold text-white">{action.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{action.description}</p>
            <code className="mt-4 block rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-emerald-300">
              {action.command}
            </code>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        <p className="font-semibold uppercase tracking-[0.25em]">Heads-up</p>
        <p className="mt-1">
          The control room is intentionally hidden. Share the URL only with trusted administrators and rotate Supabase service
          keys if you suspect exposure.
        </p>
      </div>
    </section>
  );
}

const ACTIONS = [
  {
    title: "Refresh image cache",
    description:
      "Use after swapping homepage art or blog hero images so updated assets propagate quickly through your media layer.",
    command: "npx supabase functions invoke purge-image-cache",
  },
  {
    title: "Rebuild public pages",
    description: "Regenerate the app so new content, posts, and page settings are reflected across the public site.",
    command: "npm run build && npm run start",
  },
  {
    title: "Export vendor directory",
    description: "Generate a CSV snapshot of currently active vendors for reporting or offline review.",
    command: "./scripts/export-vendors.mjs",
  },
];

export default function OperationsPanel() {
  return (
    <section className="wm-admin-surface p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="wm-admin-kicker">Operations</p>
          <h2 className="mt-2 text-3xl font-semibold text-[var(--wm-ink)]">Runbook and maintenance shortcuts</h2>
        </div>
        <p className="mb-0 max-w-2xl text-base leading-8 text-[var(--wm-muted)]">
          This area is still operational, but it now matches the rest of the studio visually so it feels like part of the
          same product instead of a separate developer panel.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {ACTIONS.map((action) => (
          <article key={action.title} className="wm-admin-overview-card p-5">
            <p className="wm-admin-kicker text-xs">Action</p>
            <h3 className="mt-2 text-2xl font-semibold text-[var(--wm-ink)]">{action.title}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--wm-muted)]">{action.description}</p>
            <code className="mt-4 block rounded-4 border border-[var(--wm-outline)] bg-white/85 px-4 py-3 text-xs text-[var(--wm-accent-strong)]">
              {action.command}
            </code>
          </article>
        ))}
      </div>

      <div className="mt-6 rounded-4 border border-[rgba(160,90,69,0.16)] bg-[rgba(246,223,213,0.48)] px-4 py-4 text-sm text-[var(--wm-ink)]">
        <p className="wm-admin-kicker text-xs">Security note</p>
        <p className="mb-0 mt-2 leading-7">
          The studio is intentionally protected behind the admin role. Keep access limited to trusted operators and rotate
          service credentials if you suspect the environment has been exposed.
        </p>
      </div>
    </section>
  );
}

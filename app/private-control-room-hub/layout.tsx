import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getUserAndRole } from "@/lib/auth/guards";

export const metadata = {
  title: "Control Room",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user, role } = await getUserAndRole();

  if (!user) {
    redirect("/login?next=/private-control-room-hub");
  }

  if (role !== "admin") {
    redirect("/");
  }

  const navigation = [
    {
      title: "Main",
      links: [
        { href: "#site-settings", label: "Site Settings", description: "Configure platform wide preferences" },
        { href: "#blog-posts", label: "Blog Posts", description: "Publish and curate editorial content" },
        { href: "#operations", label: "Operations", description: "Utilities for day-to-day management" },
      ],
    },
  ];

  const linkClasses =
    "group flex flex-col rounded-lg border border-transparent px-4 py-3 text-sm transition hover:border-slate-700 hover:bg-slate-900/70";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 lg:flex">
      <aside className="hidden w-full max-w-xs flex-col border-r border-slate-800 bg-slate-900/60 backdrop-blur lg:flex">
        <div className="border-b border-slate-800 px-6 py-8">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Wedding Market</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Admin Control Room</h1>
          <p className="mt-3 text-sm text-slate-400">Secure utilities for platform operators</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-6 py-10">
          <div className="space-y-10">
            {navigation.map((section) => (
              <div key={section.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{section.title}</p>
                <ul className="mt-5 space-y-2">
                  {section.links.map((item) => (
                    <li key={item.href}>
                      <a className={linkClasses} href={item.href}>
                        <span className="font-medium text-slate-100 group-hover:text-white">{item.label}</span>
                        <span className="text-xs text-slate-400">{item.description}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </aside>

      <div className="flex-1">
        <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-4xl flex-col gap-2 px-6 py-6">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Wedding Market</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Admin Control Room</h1>
            <p className="text-sm text-slate-400">Secure utilities for platform operators</p>
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl px-6 py-10 lg:px-12 lg:py-16">
          <div className="space-y-12 lg:space-y-16">{children}</div>
        </main>
      </div>
    </div>
  );
}

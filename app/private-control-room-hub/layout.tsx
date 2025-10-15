import { ReactNode } from "react";
import { redirect } from "next/navigation";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import AdminSidebarNav from "@/components/admin/AdminSidebarNav";
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
        {
          href: "/private-control-room-hub/site-settings",
          label: "Site Settings",
          description: "Configure platform wide preferences",
        },
        {
          href: "/private-control-room-hub/blog-posts",
          label: "Blog Posts",
          description: "Publish and curate editorial content",
        },
        {
          href: "/private-control-room-hub/operations",
          label: "Operations",
          description: "Utilities for day-to-day management",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 lg:flex">
      <aside className="hidden w-full max-w-xs flex-col border-r border-slate-800 bg-slate-900/60 backdrop-blur lg:flex">
        <div className="border-b border-slate-800 px-6 py-8">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Wedding Market</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Admin Control Room</h1>
          <p className="mt-3 text-sm text-slate-400">Secure utilities for platform operators</p>
        </div>
        <AdminSidebarNav sections={navigation} />
      </aside>

      <div className="flex-1">
        <AdminMobileNav sections={navigation} />
        <main className="mx-auto w-full max-w-4xl px-6 py-10 lg:px-12 lg:py-16">
          <div className="space-y-12 lg:space-y-16">{children}</div>
        </main>
      </div>
    </div>
  );
}

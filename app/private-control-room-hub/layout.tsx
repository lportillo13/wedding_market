import { ReactNode } from "react";
import { redirect } from "next/navigation";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import AdminSidebarNav from "@/components/admin/AdminSidebarNav";
import { getUserAndRole } from "@/lib/auth/guards";

export const metadata = {
  title: "Content Studio",
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
          href: "/private-control-room-hub",
          label: "Dashboard",
          description: "See homepage, posts, and publishing status",
        },
        {
          href: "/private-control-room-hub/site-settings",
          label: "Page Content",
          description: "Manage homepage and editorial content",
        },
        {
          href: "/private-control-room-hub/blog-posts",
          label: "Blog Studio",
          description: "View posts, images, and edit articles",
        },
        {
          href: "/private-control-room-hub/vendor-ads",
          label: "Vendor Ads",
          description: "Manage sponsored vendors and campaign banners",
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
    <div className="wm-admin-shell lg:flex">
      <aside className="wm-admin-sidebar hidden w-full max-w-xs flex-col lg:flex">
        <div className="border-b px-6 py-8">
          <p className="wm-admin-kicker">Wedding Market</p>
          <h1 className="wm-admin-title mt-2 text-2xl font-semibold tracking-tight">Content Studio</h1>
          <p className="mt-3 text-sm text-[var(--wm-muted)]">Manage marketing pages, editorial posts, publishing assets, and paid placements.</p>
        </div>
        <AdminSidebarNav sections={navigation} />
      </aside>

      <div className="wm-admin-main flex-1">
        <AdminMobileNav sections={navigation} />
        <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-12 lg:py-16">
          <div className="space-y-12 lg:space-y-16">{children}</div>
        </main>
      </div>
    </div>
  );
}

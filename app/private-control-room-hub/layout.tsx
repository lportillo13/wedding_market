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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Wedding Market</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Admin Control Room</h1>
          </div>
          <p className="text-sm text-slate-400">Secure utilities for platform operators</p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10">{children}</div>
      </main>
    </div>
  );
}

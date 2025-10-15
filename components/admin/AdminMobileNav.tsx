"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

type NavLink = {
  href: string;
  label: string;
};

type NavSection = {
  title: string;
  links: NavLink[];
};

type AdminMobileNavProps = {
  sections: NavSection[];
};

export default function AdminMobileNav({ sections }: AdminMobileNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const options = sections.flatMap((section) => section.links);
  const current = options.find((option) => option.href === pathname) ?? options[0];

  return (
    <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-6">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Wedding Market</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Admin Control Room</h1>
          <p className="text-sm text-slate-400">Secure utilities for platform operators</p>
        </div>
        <label className="flex flex-col gap-2 text-sm text-slate-400">
          <span className="font-medium uppercase tracking-[0.3em] text-slate-500">Section</span>
          <select
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500"
            value={current?.href}
            onChange={(event) => {
              const nextHref = event.target.value;
              startTransition(() => {
                router.push(nextHref);
              });
            }}
            disabled={isPending}
          >
            {options.map((option) => (
              <option key={option.href} value={option.href}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

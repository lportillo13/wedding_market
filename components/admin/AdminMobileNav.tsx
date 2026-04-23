"use client";

import { usePathname, useRouter } from "next/navigation";
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
    <div className="wm-admin-sidebar border-b lg:hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6">
        <div>
          <p className="wm-admin-kicker">Wedding Market</p>
          <h1 className="wm-admin-title text-2xl font-semibold tracking-tight">Content Studio</h1>
          <p className="text-sm text-[var(--wm-muted)]">Visual tools for homepage copy, images, and blog posts.</p>
        </div>
        <label className="flex flex-col gap-2 text-sm text-[var(--wm-muted)]">
          <span className="wm-admin-kicker text-xs">Section</span>
          <select
            className="wm-admin-input"
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

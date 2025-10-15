"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = {
  href: string;
  label: string;
  description?: string;
};

type NavSection = {
  title: string;
  links: NavLink[];
};

type AdminSidebarNavProps = {
  sections: NavSection[];
};

export default function AdminSidebarNav({ sections }: AdminSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-6 py-10">
      <div className="space-y-10">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              {section.title}
            </p>
            <ul className="mt-5 space-y-2">
              {section.links.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={clsx(
                        "group flex flex-col rounded-lg border px-4 py-3 text-sm transition",
                        "border-transparent hover:border-slate-700 hover:bg-slate-900/70",
                        isActive && "border-slate-700 bg-slate-900/80 text-white"
                      )}
                    >
                      <span className="font-medium text-slate-100 group-hover:text-white">
                        {item.label}
                      </span>
                      {item.description ? (
                        <span className="text-xs text-slate-400">{item.description}</span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

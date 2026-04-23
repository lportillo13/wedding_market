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
    <nav className="flex-1 overflow-y-auto px-6 py-8">
      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="wm-admin-kicker text-xs">{section.title}</p>
            <ul className="mt-4 space-y-3">
              {section.links.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={clsx("wm-admin-nav-link", isActive && "wm-admin-nav-link--active")}
                    >
                      <span className="font-semibold">{item.label}</span>
                      {item.description ? <span className="text-sm text-[var(--wm-muted)]">{item.description}</span> : null}
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

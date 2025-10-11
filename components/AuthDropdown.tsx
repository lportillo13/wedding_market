"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";

type AuthDropdownProps = {
  user: User;
  isVendor: boolean;
};

export default function AuthDropdown({ user, isVendor }: AuthDropdownProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleFocusOut = (event: FocusEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.relatedTarget as Node)) {
        setOpen(false);
      }
    };

    const currentMenu = menuRef.current;
    currentMenu?.addEventListener("focusout", handleFocusOut);

    return () => currentMenu?.removeEventListener("focusout", handleFocusOut);
  }, [open]);

  return (
    <div className="dropdown ms-auto" ref={menuRef}>
      <button
        className="btn btn-outline-secondary dropdown-toggle"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {user.email ?? "Account"}
      </button>
      <ul className={`dropdown-menu dropdown-menu-end${open ? " show" : ""}`}>
        <li>
          <Link className="dropdown-item" href="/account">
            Account
          </Link>
        </li>
        <li>
          <Link className="dropdown-item" href="/account/profile">
            Profile
          </Link>
        </li>
        {isVendor && (
          <li>
            <Link className="dropdown-item" href="/vendor/rfqs">
              Vendor RFQs
            </Link>
          </li>
        )}
        {!isVendor && (
          <li>
            <Link className="dropdown-item" href="/signup/vendor">
              Create vendor profile
            </Link>
          </li>
        )}
        <li>
          <form action="/auth/signout" method="post">
            <button className="dropdown-item" type="submit" onClick={() => setOpen(false)}>
              Log out
            </button>
          </form>
        </li>
      </ul>
    </div>
  );
}

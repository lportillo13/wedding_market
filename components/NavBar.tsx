"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getShortlistCount } from "@/lib/shortlist";

export default function NavBar() {
  const [count, setCount] = useState<number>(0);
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const sync = () => setCount(getShortlistCount());
    sync();
    setMounted(true);
    window.addEventListener("wm-shortlist-changed", sync);
    return () => window.removeEventListener("wm-shortlist-changed", sync);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
      <div className="container">
        <Link href="/" className="navbar-brand">Wedding Market</Link>

        <button
          className="navbar-toggler"
          type="button"
          aria-controls="wmNav"
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse${isOpen ? " show" : ""}`} id="wmNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item"><Link href="/vendors" className="nav-link">Vendors</Link></li>
            <li className="nav-item"><Link href="/account/rfqs" className="nav-link">My requests</Link></li>
          </ul>

          <div className="d-flex align-items-center gap-2">
            <Link href="/rfq/new" className="btn btn-primary btn-sm">
              Request quotes
            </Link>
            <Link href="/shortlist" className="btn btn-outline-secondary btn-sm position-relative">
              Shortlist
              {/* render badge after mount to avoid hydration mismatch */}
              {mounted && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {count}
                  <span className="visually-hidden">shortlisted</span>
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

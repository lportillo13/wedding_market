"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getShortlistCount } from "@/lib/shortlist";

export default function NavBar() {
  const [count, setCount] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const sync = () => setCount(getShortlistCount());
    sync();
    setMounted(true);
    window.addEventListener("wm-shortlist-changed", sync);
    return () => window.removeEventListener("wm-shortlist-changed", sync);
  }, []);

  return (
    <nav className="navbar navbar-expand-lg bg-body border-bottom">
      <div className="container">
        <Link href="/" className="navbar-brand">Wedding Market</Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#wmNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse" id="wmNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item"><Link href="/vendors" className="nav-link">Vendors</Link></li>
            <li className="nav-item"> <a href="/account/rfqs" className="nav-link">My requests</a></li>
          </ul>

          <div className="d-flex align-items-center gap-2">
            <Link href="/rfq/new" className="btn btn-primary btn-sm">
              Request quotes
            </Link>
            <Link href="/rfq/new" className="btn btn-outline-secondary btn-sm position-relative">
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

"use client";

import Link from "next/link";

export default function VendorAccessPrompt({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="wm-profile-access">
      <span className="wm-profile-access__mark" aria-hidden="true">
        ✧
      </span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
        <Link href={href} className="btn btn-outline-primary">
          {action}
          <span aria-hidden="true">↗︎</span>
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserAndRole } from "@/lib/auth/guards";

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getUserAndRole();
  if (!user) redirect(`/login?next=${encodeURIComponent("/vendor/profile")}`);

  return (
    <div className="container py-4">
      <h1 className="mb-3">Vendor Dashboard</h1>
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item"><Link className="nav-link" href="/vendor">Overview</Link></li>
        <li className="nav-item"><Link className="nav-link" href="/vendor/profile">Profile</Link></li>
        <li className="nav-item"><Link className="nav-link" href="/vendor/location">Location</Link></li>
        <li className="nav-item"><Link className="nav-link" href="/vendor/categories">Categories</Link></li>
        <li className="nav-item"><Link className="nav-link" href="/vendor/publish">Publish</Link></li>
      </ul>
      {children}
    </div>
  );
}

// app/vendors/page.tsx
import { headers } from "next/headers";
import VendorsPageContent from "./VendorsPageContent";
import type { VendorListItem, VendorsResponse } from "./types";

async function fetchVendors(sp: Record<string, string>): Promise<VendorsResponse> {
  const qs = new URLSearchParams();
  if (sp.q) qs.set("q", sp.q);
  if (sp.category) qs.set("category", sp.category);
  if (sp.page) qs.set("page", sp.page);

  // 🔧 Build absolute URL (relative fails on the server)
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const base = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`;

  const url = `${base}/api/vendors${qs.toString() ? `?${qs.toString()}` : ""}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load vendors (${res.status})`);
  return res.json();
}

export default async function VendorsPage({
  searchParams,
}: {
  // Next.js 15: searchParams is async
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const { items, total } = await fetchVendors(sp);

  const page = Number(sp.page || 1);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

  return (
    <VendorsPageContent
      items={items as VendorListItem[]}
      page={page}
      searchParams={sp}
      totalPages={totalPages}
    />
  );
}

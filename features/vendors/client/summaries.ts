export type VendorSummary = {
  id: string;
  slug: string | null;
  business_name: string;
  categories?: string[] | null;
};

/** Match the API's 50-ID bound without dropping larger saved shortlists. */
export async function fetchVendorSummaries(ids: string[], signal?: AbortSignal): Promise<VendorSummary[]> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const items: VendorSummary[] = [];
  for (let offset = 0; offset < uniqueIds.length; offset += 50) {
    const searchParams = new URLSearchParams({ ids: uniqueIds.slice(offset, offset + 50).join(",") });
    const response = await fetch(`/api/vendors/by-ids?${searchParams}`, { signal });
    if (!response.ok) throw new Error(`Failed to load vendors (${response.status})`);
    const json = await response.json() as { items?: VendorSummary[]; error?: string } | null;
    if (json?.error) throw new Error(json.error);
    if (!Array.isArray(json?.items)) throw new Error("The server returned an invalid vendor list.");
    items.push(...json.items);
  }
  return items;
}

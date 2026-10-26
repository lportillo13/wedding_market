"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchVendorSummaries, type VendorSummary } from "@/features/vendors/client/summaries";
export type { VendorSummary } from "@/features/vendors/client/summaries";

export function useVendorSummaries(ids: string[]) {
  const [vendorsById, setVendorsById] = useState<Record<string, VendorSummary>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uniqueIds = useMemo(() => Array.from(new Set(ids.filter(Boolean))), [ids]);

  useEffect(() => {
    if (!uniqueIds.length) {
      return;
    }

    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const items = await fetchVendorSummaries(uniqueIds, controller.signal);
        if (controller.signal.aborted) return;

        const next: Record<string, VendorSummary> = {};
        for (const item of items) {
          next[item.id] = item;
        }

        setVendorsById(next);
        setLoading(false);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        console.error(err);
        setVendorsById({});
        setLoading(false);
        setError(err instanceof Error ? err.message : "Unable to load vendors.");
      }
    };

    run();

    return () => controller.abort();
  }, [uniqueIds]);

  const hasIds = uniqueIds.length > 0;

  return {
    vendorsById: hasIds ? vendorsById : {},
    loading: hasIds ? loading : false,
    error: hasIds ? error : null,
  };
}

import { PublicJsonCache } from '@/lib/resources/public-json-cache';
import type { VendorsResponse } from '@/app/vendors/types';

const state = globalThis as typeof globalThis & { weddingMarketPublicDirectory?: PublicJsonCache<VendorsResponse> };
export const publicDirectoryCache = state.weddingMarketPublicDirectory ??= new PublicJsonCache<VendorsResponse>({
  ttlMs: 30_000, maxEntries: 64, maxBytes: 2 * 1024 * 1024, maxPending: 16,
});

export function invalidatePublicVendorCache() { publicDirectoryCache.clear(); }

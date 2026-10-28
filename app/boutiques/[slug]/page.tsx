import { notFound } from 'next/navigation';
import BoutiqueExperience from '@/features/boutiques/client/BoutiqueExperience';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBoutiqueCatalog } from '@/features/boutiques/server/service';
import type { Boutique } from '@/shared/boutiques/types';
export const dynamic = 'force-dynamic';
export default async function Page({ params, searchParams }: {
    params: Promise<{
        slug: string;
    }>;
    searchParams: Promise<{
        outfit?: string;
    }>;
}) { const { slug } = await params; const { outfit } = await searchParams; const db = await createSupabaseServerClient(); const shop = await getBoutiqueCatalog(db, slug, 1, null) as Boutique | null; if (!shop)
    notFound(); const selection = outfit && /^[0-9a-f-]{36}$/i.test(outfit) ? await getBoutiqueCatalog(db, slug, 1, null, outfit) as Boutique | null : null; return <BoutiqueExperience store={shop} selectedOutfit={selection?.items[0] ?? null}/>; }

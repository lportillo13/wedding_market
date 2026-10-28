import BoutiqueExperience from '@/features/boutiques/client/BoutiqueExperience';
import { createSupabasePublicClient } from '@/lib/supabase/public';
import { getBoutiqueCatalog } from '@/features/boutiques/server/service';
import type { Boutique } from '@/shared/boutiques/types';
import { exampleBoutiques } from '@/shared/boutiques/examples';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ searchParams }: {
    searchParams: Promise<{
        examples?: string;
    }>;
}) { return { title: 'Dresses & suits | Wedding Market', description: 'Discover wedding boutiques, dresses and suits in Costa Rica and request a fitting appointment.', ...((await searchParams).examples === '1' ? { robots: { index: false, follow: false } } : {}) }; }
export default async function Page({ searchParams }: {
    searchParams: Promise<{
        examples?: string;
    }>;
}) {
    const params = await searchParams;
    if (params.examples === '1')
        return <BoutiqueExperience initial={{ items: exampleBoutiques() }}/>;
    let initial = { items: [] as Boutique[] };
    try {
        initial = await getBoutiqueCatalog(createSupabasePublicClient(), null, 1, null) as {
            items: Boutique[];
        };
    }
    catch { /* Client displays a retryable service error if the directory is unavailable. */ }
    return <BoutiqueExperience initial={initial}/>;
}

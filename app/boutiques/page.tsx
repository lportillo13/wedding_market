import BoutiqueExperience from '@/features/boutiques/client/BoutiqueExperience';
import { createSupabasePublicClient } from '@/lib/supabase/public';
import { getBoutiqueCatalog } from '@/features/boutiques/server/service';
import type { Boutique } from '@/shared/boutiques/types';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dresses & suits | Wedding Market', description: 'Discover wedding boutiques, dresses and suits in Costa Rica and request a fitting appointment.' };
export default async function Page() { let initial = { items: [] as Boutique[] }; try {
    initial = await getBoutiqueCatalog(createSupabasePublicClient(), null, 1, null) as {
        items: Boutique[];
    };
}
catch { /* Client displays a retryable service error if the directory is unavailable. */ } return <BoutiqueExperience initial={initial}/>; }

import { Suspense, type ReactNode } from 'react';
import { BoutiqueTransportProvider } from '@/features/boutiques/client/transport';
export default function Layout({ children }: {
    children: ReactNode;
}) { return <Suspense fallback={<p className="container py-4">Wedding Market…</p>}><BoutiqueTransportProvider>{children}</BoutiqueTransportProvider></Suspense>; }

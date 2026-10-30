"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { isVendorProfileSection, type VendorProfileSection, type VendorWorkspaceSummary } from './workspace-navigation';

type WorkspaceContext = {
  summary: VendorWorkspaceSummary;
  activeSection: VendorProfileSection;
  visited: VendorProfileSection[];
  chooseSection: (section: VendorProfileSection) => void;
  dirtySections: Partial<Record<VendorProfileSection, boolean>>;
  setDirtySections: (sections: Partial<Record<VendorProfileSection, boolean>>) => void;
};
const Context = createContext<WorkspaceContext | null>(null);
export function VendorWorkspaceProvider({summary, children}: {summary: VendorWorkspaceSummary; children: ReactNode}) {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<VendorProfileSection>('details');
  const [visited, setVisited] = useState<VendorProfileSection[]>(['details']);
  const [dirtySections, setDirtySections] = useState<Partial<Record<VendorProfileSection, boolean>>>({});
  const chooseSection = useCallback((section: VendorProfileSection) => {
    setActiveSection(section);
    setVisited(current => current.includes(section) ? current : [...current, section]);
    window.history.replaceState(window.history.state, '', `#${section}`);
  }, []);
  useEffect(() => {
    if (pathname !== '/vendor/profile') return;
    const applyHash = () => {
      const hash = window.location.hash.slice(1);
      const section = isVendorProfileSection(hash) ? hash : 'details';
      setActiveSection(section);
      setVisited(current => current.includes(section) ? current : [...current, section]);
    };
    const frame = requestAnimationFrame(applyHash);
    window.addEventListener('hashchange', applyHash);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('hashchange', applyHash); };
  }, [pathname]);
  const value = useMemo(() => ({summary, activeSection, visited, chooseSection, dirtySections, setDirtySections}), [summary, activeSection, visited, chooseSection, dirtySections]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useVendorWorkspace() {
  const workspace = useContext(Context);
  if (!workspace) throw new Error('Vendor workspace provider is missing.');
  return workspace;
}

"use client";

export default function ClientOnly({ children }: { children: React.ReactNode }) {
  const mounted = typeof window !== "undefined";
  if (!mounted) return null;
  return <div suppressHydrationWarning>{children}</div>;
}

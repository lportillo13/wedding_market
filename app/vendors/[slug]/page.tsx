import ContentSafety from "@/components/safety/ContentSafety";
import { getRequestLanguage } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { getRoles } from "@/lib/auth/roles";
import { loadVendorAdsConfig } from "@/lib/content/vendorAdsServer";
import { fetchVendorContactPrefill, fetchVendorProfile, fetchVendorShareMetadata } from "./data";
import VendorPageShell from "./VendorPageShell";
import { exampleVendorProfile } from "@/features/vendors/examples";
import { isExampleVendor } from "@/shared/vendors/examples";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (isExampleVendor(slug)) return { title: 'Sample vendor | Wedding Market', robots: { index: false, follow: false } };
  const shareMetadata = await fetchVendorShareMetadata(slug);

  const vendorName = shareMetadata?.name ?? "Proveedor de bodas";
  const title = `${vendorName} | Wedding Market`;
  const description = shareMetadata?.description ?? `Descubre a ${vendorName} en Wedding Market.`;

  const openGraphImages = shareMetadata?.thumbnail
    ? [
        {
          url: shareMetadata.thumbnail.url,
          width: shareMetadata.thumbnail.width,
          height: shareMetadata.thumbnail.height,
          alt: `Miniatura de ${vendorName}`,
        },
      ]
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Wedding Market",
      images: openGraphImages,
    },
    twitter: {
      card: openGraphImages ? "summary_large_image" : "summary",
      title,
      description,
      images: openGraphImages?.map((image) => image.url),
    },
  };
}

export default async function VendorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const language = await getRequestLanguage();
  const example = exampleVendorProfile(slug, language === 'es' ? 'es' : 'en');
  if (example) return <VendorPageShell profile={example} contactPrefill={null} isVendor={false} isLoggedIn={true} isExample adsConfig={await loadVendorAdsConfig()} />;
  const { user, isVendor } = await getRoles();
  const profile = await fetchVendorProfile(slug);
  const [contactPrefill, adsConfig] = await Promise.all([
    fetchVendorContactPrefill(profile.vendor.id),
    loadVendorAdsConfig(),
  ]);

  return (<>
    <VendorPageShell
      profile={profile}
      contactPrefill={contactPrefill}
      isVendor={isVendor}
      isLoggedIn={Boolean(user)}
      adsConfig={adsConfig}
    />
    <div className="container"><ContentSafety kind="vendor" targetId={profile.vendor.id} language={language} /></div>
  </>);
}

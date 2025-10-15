import type { Metadata } from "next";
import { fetchVendorProfile } from "./data";

export default async function Head({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await fetchVendorProfile(slug);
  const title = `${profile.vendor.name} | Wedding Vendor Profile`;
  const description =
    profile.vendor.summary ||
    profile.vendor.description ||
    `Discover ${profile.vendor.name} for your wedding celebration.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

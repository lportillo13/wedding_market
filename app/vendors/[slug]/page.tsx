// README: This page reads from the `public.vendor_profile_view` Supabase view for core vendor data
// and the `public.reviews_public` view for review details. The contact form posts to
// `/api/rfqs/create` which persists into `public.rfqs` and `public.rfq_invites`.

import type { Metadata } from "next";
import Breadcrumbs from "@/components/vendor/Breadcrumbs";
import VendorAbout from "@/components/vendor/VendorAbout";
import VendorAmenities from "@/components/vendor/VendorAmenities";
import VendorAvailability from "@/components/vendor/VendorAvailability";
import VendorContact from "@/components/vendor/VendorContact";
import VendorGallery from "@/components/vendor/VendorGallery";
import VendorHeader from "@/components/vendor/VendorHeader";
import VendorPricing from "@/components/vendor/VendorPricing";
import VendorReviews from "@/components/vendor/VendorReviews";
import VendorTabs from "@/components/vendor/VendorTabs";
import VendorTeam from "@/components/vendor/VendorTeam";
import { fetchVendorProfile, fetchVendorShareMetadata } from "./data";

const SECTIONS = [
  { id: "photos", label: "Photos" },
  { id: "about", label: "About" },
  { id: "pricing", label: "Pricing" },
  { id: "amenities", label: "Amenities" },
  { id: "team", label: "Team" },
  { id: "availability", label: "Availability" },
  { id: "reviews", label: "Reviews" },
  { id: "contact", label: "Contact" },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const shareMetadata = await fetchVendorShareMetadata(slug);

  const vendorName = shareMetadata?.name ?? "Wedding Vendor";
  const title = `${vendorName} | Wedding Market`;
  const description =
    shareMetadata?.description ?? `Discover ${vendorName} on Wedding Market.`;

  const openGraphImages = shareMetadata?.thumbnail
    ? [
        {
          url: shareMetadata.thumbnail.url,
          width: shareMetadata.thumbnail.width,
          height: shareMetadata.thumbnail.height,
          alt: `${vendorName} thumbnail`,
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
  const profile = await fetchVendorProfile(slug);

  return (
    <div className="bg-light">
      <div className="container py-3">
        <Breadcrumbs
          categories={profile.breadcrumbs.categories}
          location={{
            city: profile.breadcrumbs.city,
            region: profile.breadcrumbs.region,
            country: profile.breadcrumbs.country,
          }}
          vendorName={profile.vendor.name}
        />
      </div>
      <div className="container pb-5">
        <VendorHeader vendor={profile.vendor} />
        <div className="position-sticky bg-light border-bottom" style={{ zIndex: 100, top: "72px" }}>
          <VendorTabs sections={SECTIONS} />
        </div>
        <section id="photos" className="py-4">
          <VendorGallery media={profile.media} vendorName={profile.vendor.name} />
        </section>
        <section id="about" className="py-4 border-top">
          <VendorAbout vendor={profile.vendor} spaces={profile.spaces} />
        </section>
        <section id="pricing" className="py-4 border-top">
          <VendorPricing vendor={profile.vendor} pricing={profile.pricing} />
        </section>
        <section id="amenities" className="py-4 border-top">
          <VendorAmenities amenities={profile.amenities} capacityMax={profile.vendor.capacityMax} />
        </section>
        <section id="team" className="py-4 border-top">
          <VendorTeam team={profile.team} />
        </section>
        <section id="availability" className="py-4 border-top">
          <VendorAvailability note={profile.availability.note} />
        </section>
        <section id="reviews" className="py-4 border-top">
          <VendorReviews reviews={profile.reviews} />
        </section>
        <section id="contact" className="py-5 border-top">
          <VendorContact vendor={profile.vendor} />
        </section>
      </div>
    </div>
  );
}

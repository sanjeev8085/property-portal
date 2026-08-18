import type { Metadata } from "next";
import React from "react";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const slugOrId = resolvedParams?.id || "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurahomes.in";

  // Clean formatting for title from slug or ID
  const readableTitle = slugOrId
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "")
    .replace(/-/g, " ")
    .trim();

  const pageTitle = readableTitle.length > 5
    ? readableTitle.replace(/\b\w/g, (c) => c.toUpperCase())
    : "Verified Property Listing Details";

  return {
    title: `${pageTitle} | Verified Listing`,
    description: `Explore verified property listing, photos, price breakdown, amenities, and direct owner contact on AuraHomes.`,
    alternates: {
      canonical: `${siteUrl}/properties/${slugOrId}`,
    },
    openGraph: {
      title: `${pageTitle} | AuraHomes`,
      description: `Verified listing with direct owner contact and zero brokerage on AuraHomes.`,
      url: `${siteUrl}/properties/${slugOrId}`,
      type: "article",
      images: [
        {
          url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&h=630&q=80",
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${pageTitle} | AuraHomes`,
      description: `Explore verified property listing details and pricing on AuraHomes.`,
      images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&h=630&q=80"],
    },
  };
}

export default async function PropertyLayout({ children }: Props) {
  return <>{children}</>;
}

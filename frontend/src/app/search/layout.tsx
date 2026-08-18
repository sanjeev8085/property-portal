import type { Metadata } from "next";
import React from "react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurahomes.in";

export const metadata: Metadata = {
  title: "Search Properties for Rent & Sale",
  description:
    "Explore verified apartments, houses, villas, and commercial properties across India. Filter by BHK, budget, furnished status, and locality.",
  alternates: {
    canonical: `${siteUrl}/search`,
  },
  openGraph: {
    title: "Search Properties for Rent & Sale | AuraHomes",
    description:
      "Filter thousands of verified properties in top Indian cities. Direct owner listings and zero brokerage.",
    url: `${siteUrl}/search`,
    type: "website",
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

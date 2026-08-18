import type { Metadata } from "next";
import React from "react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurahomes.in";

export const metadata: Metadata = {
  title: "About Us | Transforming Real Estate in India",
  description:
    "Learn about AuraHomes, India's innovative property listing and verification marketplace connecting buyers and owners with complete transparency.",
  alternates: {
    canonical: `${siteUrl}/about`,
  },
  openGraph: {
    title: "About AuraHomes | Leading Property Marketplace",
    description: "Learn how AuraHomes makes buying, renting, and listing properties seamless and verified.",
    url: `${siteUrl}/about`,
    type: "website",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

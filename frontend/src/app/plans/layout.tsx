import type { Metadata } from "next";
import React from "react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurahomes.in";

export const metadata: Metadata = {
  title: "Subscription Plans & Pricing",
  description:
    "Choose transparent contact credit plans for buyers, tenants, and owners. Get verified leads and unlimited property browsing on AuraHomes.",
  alternates: {
    canonical: `${siteUrl}/plans`,
  },
  openGraph: {
    title: "Subscription Plans & Pricing | AuraHomes",
    description: "Affordable credit packages with instant contact unlocking and zero brokerage.",
    url: `${siteUrl}/plans`,
    type: "website",
  },
};

export default function PlansLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

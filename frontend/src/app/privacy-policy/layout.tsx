import type { Metadata } from "next";
import React from "react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurahomes.in";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read the AuraHomes privacy policy to understand how your property data, contact information, and payment transactions are secured.",
  alternates: {
    canonical: `${siteUrl}/privacy-policy`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

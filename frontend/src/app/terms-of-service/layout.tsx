import type { Metadata } from "next";
import React from "react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurahomes.in";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Review terms and conditions for listing properties, purchasing contact credits, and using AuraHomes real estate services.",
  alternates: {
    canonical: `${siteUrl}/terms-of-service`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsOfServiceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

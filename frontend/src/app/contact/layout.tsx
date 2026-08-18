import type { Metadata } from "next";
import React from "react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurahomes.in";

export const metadata: Metadata = {
  title: "Contact Us & Customer Support",
  description:
    "Get in touch with the AuraHomes support team for listing inquiries, verification questions, and partnership opportunities.",
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
  openGraph: {
    title: "Contact Us & Support | AuraHomes",
    description: "Reach our dedicated real estate support team.",
    url: `${siteUrl}/contact`,
    type: "website",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

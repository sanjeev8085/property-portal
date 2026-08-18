import type { Metadata, Viewport } from "next";
import React from "react";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import { ToastProvider } from "@/components/ui/Toast";
import BottomNav from "@/components/ui/BottomNav";
import Footer from "@/components/ui/Footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurahomes.in";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AuraHomes | India's Premier Real Estate & Property Marketplace",
    template: "%s | AuraHomes",
  },
  description:
    "Discover verified properties for rent and sale across India. Explore apartments, villas, plots, and commercial spaces with zero brokerage and direct owner contact.",
  keywords: [
    "real estate india",
    "properties for sale",
    "apartments for rent",
    "flats in bhopal",
    "villas in indore",
    "zero brokerage properties",
    "verified real estate listings",
  ],
  authors: [{ name: "AuraHomes Real Estate" }],
  creator: "AuraHomes Technologies Pvt. Ltd.",
  publisher: "AuraHomes",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "AuraHomes",
    title: "AuraHomes | India's Premier Real Estate & Property Marketplace",
    description:
      "Search thousands of verified residential and commercial properties with direct owner contact and zero brokerage.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&h=630&q=80",
        width: 1200,
        height: 630,
        alt: "AuraHomes Real Estate Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AuraHomes | Discover & Sell Verified Properties",
    description:
      "Find verified properties with zero brokerage and direct owner contacts across top Indian cities.",
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&h=630&q=80",
    ],
    creator: "@aurahomes",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLdOrg = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "AuraHomes",
    "url": siteUrl,
    "logo": `${siteUrl}/favicon.ico`,
    "description": "India's premier real estate listing and property verification marketplace.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Bhopal",
      "addressRegion": "Madhya Pradesh",
      "postalCode": "462016",
      "addressCountry": "IN"
    },
    "sameAs": [
      "https://twitter.com/aurahomes",
      "https://facebook.com/aurahomes",
      "https://instagram.com/aurahomes"
    ]
  };

  const jsonLdWebSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "AuraHomes",
    "url": siteUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
      </head>
      <body>
        <ToastProvider>
          {/* Navigation Bar */}
          <Navbar />

          {/* Main Content Area */}
          <main className="main-content-layout">{children}</main>

          {/* Site Footer */}
          <Footer />

          {/* Mobile Bottom Navigation */}
          <BottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}

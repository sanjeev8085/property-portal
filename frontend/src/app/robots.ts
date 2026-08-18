import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aurahomes.in";
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/search",
          "/properties",
          "/properties/*",
          "/plans",
          "/about",
          "/contact",
          "/privacy-policy",
          "/terms-of-service",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/dashboard",
          "/dashboard/*",
          "/api/*",
          "/checkout/*",
          "/verify-otp",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

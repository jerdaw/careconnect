import type { MetadataRoute } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kingstoncare.ca"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/dashboard/", "/login/", "/settings/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}

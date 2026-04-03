import type { MetadataRoute } from "next"
import { getPublicBaseUrl } from "@/lib/brand"

const BASE_URL = getPublicBaseUrl()

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

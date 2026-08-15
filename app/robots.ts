import type { MetadataRoute } from "next"
import { getPublicBaseUrl } from "@/lib/brand"
import { PUBLIC_SERVICE_MODE, isPublicServiceRetired, type PublicServiceMode } from "@/lib/public-service-mode"

const BASE_URL = getPublicBaseUrl()

export function buildRobots(publicServiceMode: PublicServiceMode = PUBLIC_SERVICE_MODE): MetadataRoute.Robots {
  if (isPublicServiceRetired(publicServiceMode)) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    }
  }

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

export default function robots(): MetadataRoute.Robots {
  return buildRobots()
}

import type { MetadataRoute } from "next"
import { promises as fs } from "fs"
import path from "path"
import { getPublicBaseUrl } from "@/lib/brand"

const BASE_URL = getPublicBaseUrl()

const locales = ["en", "fr", "zh-Hans", "ar", "pt", "es", "pa"] as const

type SitemapEntry = MetadataRoute.Sitemap[number]

function buildAlternates(pathname: string): SitemapEntry["alternates"] {
  const languages: Record<string, string> = {}
  for (const locale of locales) {
    languages[locale] = `${BASE_URL}/${locale}${pathname}`
  }
  return { languages }
}

function staticEntry(
  pathname: string,
  priority: number,
  changeFrequency: SitemapEntry["changeFrequency"]
): SitemapEntry[] {
  return locales.map((locale) => ({
    url: `${BASE_URL}/${locale}${pathname}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: buildAlternates(pathname),
  }))
}

async function loadServiceIds(): Promise<string[]> {
  try {
    const filePath = path.join(process.cwd(), "data", "services.json")
    const raw = await fs.readFile(filePath, "utf-8")
    const services = JSON.parse(raw) as Array<{ id: string; published?: boolean; deleted_at?: string | null }>
    return services.filter((s) => s.published !== false && !s.deleted_at).map((s) => s.id)
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  // Homepage
  entries.push(...staticEntry("", 1.0, "daily"))

  // Static pages
  const staticPages = [
    "/about",
    "/about/partners",
    "/accessibility",
    "/privacy",
    "/terms",
    "/content-policy",
    "/partner-terms",
    "/faq",
    "/user-guide",
    "/impact",
    "/submit-service",
    "/offline",
  ]

  for (const page of staticPages) {
    entries.push(...staticEntry(page, 0.8, "weekly"))
  }

  // Dynamic service pages
  const serviceIds = await loadServiceIds()
  for (const id of serviceIds) {
    entries.push(
      ...locales.map((locale) => ({
        url: `${BASE_URL}/${locale}/service/${id}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
        alternates: buildAlternates(`/service/${id}`),
      }))
    )
  }

  return entries
}

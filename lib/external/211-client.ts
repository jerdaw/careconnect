import { Service, VerificationLevel } from "@/types/service"
import { logger } from "@/lib/logger"

const API_BASE = "https://api.211ontario.ca/v1" // Placeholder URL

interface Raw211Service {
  id: string
  name: string
  description: string
  address: { street: string; city: string; postal: string }
  phone: string
  url: string
  taxonomy: { code: string; name: string }[]
}

export async function fetch211Services(region: string = "Kingston"): Promise<Service[]> {
  if (!process.env.API_211_KEY) {
    throw new Error("Missing API_211_KEY for manual 211 sync")
  }

  try {
    const res = await fetch(`${API_BASE}/services?region=${region}`, {
      headers: { Authorization: `Bearer ${process.env.API_211_KEY}` },
      next: { revalidate: 86400 }, // 24h cache
    })

    if (!res.ok) throw new Error(`211 API error: ${res.status}`)

    const raw = (await res.json()) as Raw211Service[]
    return raw.map(mapToService)
  } catch (error) {
    logger.error("Failed to fetch from 211", error)
    throw error
  }
}

function mapToService(raw: Raw211Service): Service {
  return {
    id: `211-${raw.id}`,
    name: raw.name,
    description: raw.description,
    phone: raw.phone,
    url: raw.url,
    address: `${raw.address.street}, ${raw.address.city} ${raw.address.postal}`,
    verification_level: VerificationLevel.L2,

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- enum mapping from 211 taxonomy to app IntentCategory
    intent_category: mapTaxonomyToCategory(raw.taxonomy) as any,
    provenance: {
      verified_by: "211 Ontario API",
      verified_at: new Date().toISOString(),
      evidence_url: "https://211ontario.ca",
      method: "Automated Sync",
    },
    synthetic_queries: [],
    identity_tags: [],
    last_verified: new Date().toISOString(),
  }
}

function mapTaxonomyToCategory(taxonomy: { code: string; name: string }[]): string {
  if (!taxonomy || taxonomy.length === 0) return "Other"

  const categoryMap: Record<string, string> = {
    BD: "Food",
    BH: "Housing",
    RP: "Crisis",
  }

  const firstCode = taxonomy[0]?.code
  const code = firstCode ? firstCode.substring(0, 2) : ""
  return categoryMap[code] || "Other"
}

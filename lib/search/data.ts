import { Service } from "@/types/service"
import { supabase } from "@/lib/supabase"
import { env } from "@/lib/env"

// In-memory cache for the server instance
let dataCache: { services: Service[] } | null = null

/**
 * Loads services from Supabase (if configured) or falls back to local JSON.
 * Uses dynamic imports to avoid bundling large JSON files when running in server mode.
 */
export const loadServices = async (): Promise<Service[]> => {
  // Return cache if available
  if (dataCache) return dataCache.services

  // Note: getSearchMode() can be used here if needed for mode-specific logic
  // Currently, we use a unified approach: try DB -> fallback to JSON

  // 1. Server Mode: Fetch from API (if valid context) or fall back to dynamic JSON
  // Note: ideally servers use the API, but if this func is called on server, we might need local data
  // For now, consistent behavior: try DB -> fall back to local JSON (dynamically loaded)

  try {
    // Check if we have credentials to attempt DB fetch
    const hasCredentials = env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    // In server mode, we prefer DB or API
    if (hasCredentials) {
      const { data, error } = await supabase.from("services").select("*")

      if (!error && data && data.length > 0) {
        // We still need metadata from JSON if we want to overlay it (AI/Synthetic queries)
        // Dynamically load JSON for metadata overlay
        // TODO: Move this metadata to DB in future phases to remove JSON dependency entirely
        const { default: servicesData } = await import("@/data/services.json")
        const { default: embeddingsData } = await import("@/data/embeddings.json")
        
        const fallbackServices = servicesData as unknown as Service[]
        const fallbackEmbeddings = embeddingsData as unknown as Record<string, number[]>

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedData: Service[] = data.map((row: any) => {
          // Find static metadata from services.json to overlay (AI metadata)
          const staticService = fallbackServices.find((s) => s.id === row.id)

          return {
            ...row,
            // Parse embedding if it's a string, or keep if array, or use fallback
            embedding:
              (typeof row.embedding === "string" ? JSON.parse(row.embedding) : row.embedding) ||
              fallbackEmbeddings[row.id],
            // Cast jsonb fields
            identity_tags: typeof row.tags === "string" ? JSON.parse(row.tags) : row.tags,
            intent_category: row.category, // Map DB column back to TS property
            verification_level: row.verification_status,
            // Overlay rich metadata if missing in DB
            synthetic_queries: staticService?.synthetic_queries || [],
            // If tags are missing in DB, use static
            ...(!row.tags && staticService?.identity_tags ? { identity_tags: staticService.identity_tags } : {}),
            
            // Ensure boolean flags are present
            is_provincial: row.is_provincial || false,
            published: row.published !== false 
          }
        })

        dataCache = { services: mappedData }
        return mappedData
      } else if (error) {
        console.warn("Supabase fetch error (falling back to JSON):", error.message)
      }
    }
  } catch (err) {
    console.warn("Data load failed (falling back to JSON):", err)
  }

  // Fallback: Dynamic Import of Local JSON
  const { default: servicesData } = await import("@/data/services.json")
  const { default: embeddingsData } = await import("@/data/embeddings.json")
  
  const fallbackServices = servicesData as unknown as Service[]
  const fallbackEmbeddings = embeddingsData as unknown as Record<string, number[]>

  const enrichedFallback = fallbackServices.map((s) => ({
    ...s,
    embedding: fallbackEmbeddings[s.id],
  }))
  dataCache = { services: enrichedFallback }
  return enrichedFallback
}

export async function getSearchTerms(): Promise<string[]> {
  const services = await loadServices()
  const terms = new Set<string>()

  for (const service of services) {
    terms.add(service.name)
    if (service.name_fr) terms.add(service.name_fr)
    service.identity_tags.forEach((tag) => terms.add(tag.tag))
  }

  return Array.from(terms)
}

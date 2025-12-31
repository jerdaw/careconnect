import { Service } from "@/types/service"
import servicesData from "@/data/services.json"
import embeddingsData from "@/data/embeddings.json"
import { supabase } from "@/lib/supabase"
import { env } from "@/lib/env"

// Helper to ensure strict typing for the fallback JSON data
export const fallbackServices: Service[] = servicesData as unknown as Service[]
export const fallbackEmbeddings: Record<string, number[]> = embeddingsData as unknown as Record<string, number[]>

// In-memory cache for the server instance
let dataCache: { services: Service[] } | null = null

/**
 * Loads services from Supabase (if configured) or falls back to local JSON.
 * Implements Stale-While-Revalidate or simple caching strategy.
 */
export const loadServices = async (): Promise<Service[]> => {
  // Return cache if available
  if (dataCache) return dataCache.services

  try {
    // Check if we have credentials to attempt DB fetch
    const hasCredentials = env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    if (hasCredentials) {
      const { data, error } = await supabase.from("services").select("*")

      if (!error && data && data.length > 0) {
        // Parse embedding strings if they come back as strings (pgvector behavior pending client version)
        // mappedData ensures types match Service interface
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

  // Fallback to local JSON (with embeddings)
  const enrichedFallback = fallbackServices.map((s) => ({
    ...s,
    embedding: fallbackEmbeddings[s.id],
  }))
  dataCache = { services: enrichedFallback }
  return enrichedFallback
}

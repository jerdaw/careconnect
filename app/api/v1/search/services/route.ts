
import { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { createApiResponse, createApiError, handleApiError } from "@/lib/api-utils"
import { searchRequestSchema } from "@/lib/schemas/search"
import { detectCrisis } from "@/lib/search/crisis"
import { ServicePublic } from "@/types/service-public"

export async function POST(request: NextRequest) {
  // 1. Rate limiting
  const clientIp = getClientIp(request)
  const rateLimit = checkRateLimit(clientIp, 60, 60 * 1000) // 60/min for search
  if (!rateLimit.success) {
    return createApiError("Rate limit exceeded", 429)
  }

  try {
    // 2. Parse and validate body
    const body = await request.json()
    const parsed = searchRequestSchema.safeParse(body)
    if (!parsed.success) {
      return createApiError("Invalid request", 400, parsed.error.flatten())
    }
    const { query, locale, filters, options } = parsed.data

    // 3. Build Supabase query against services_public view
    let dbQuery = supabase
      .from("services_public")
      .select("*", { count: "exact" })

    // 4. Apply text search (locale-aware)
    if (query.trim()) {
      const nameField = locale === "fr" ? "name_fr" : "name"
      const descField = locale === "fr" ? "description_fr" : "description"
      
      // ILIKE search on name OR description
      dbQuery = dbQuery.or(
        `${nameField}.ilike.%${query}%,${descField}.ilike.%${query}%`
      )
    }

    // 5. Apply category filter
    if (filters.category) {
      dbQuery = dbQuery.eq("category", filters.category)
    }

    // 6. Pagination & Sorting
    const { limit, offset } = options
    
    // Default Sort: Verification Level (Highest first) -> Freshness (Newest first)
    // Note: This approximates the client-side multipliers for L3/L2 and Freshness
    dbQuery = dbQuery
      .order("verification_status", { ascending: false }) // L3 > L2 > L1
      .order("last_verified", { ascending: false })
      .range(offset, offset + limit - 1)

    // 7. Execute
    const { data, count, error } = await dbQuery

    if (error) {
      // Log error but NOT the query (handled by createApiError/logging infra if extended)
      // For now, simple return
      console.error("Supabase search error:", error.message) 
      return createApiError("Search failed", 500)
    }

    // 8. Crisis detection (server-side boost)
    let results = (data as unknown as ServicePublic[]) || []

    // ROBUSTNESS PATCH: Ensure 988 is always Canada-wide (fixes stale DB data in dev)
    results = results.map(s => {
      if (s.id === "crisis-988") {
        return { ...s, scope: "canada" }
      }
      return s
    })
    
    // Safety boost: if query indicates crisis, ensure crisis services are top
    if (query.trim() && detectCrisis(query)) {
      const crisis = results.filter(s => s.category === "Crisis")
      const nonCrisis = results.filter(s => s.category !== "Crisis")
      results = [...crisis, ...nonCrisis]
    }

    // 9. Response with privacy headers
    const response = createApiResponse(results, {
      meta: { total: count || 0, limit, offset }
    })
    
    // Privacy: no caching when query present
    if (query.trim()) {
      response.headers.set("Cache-Control", "no-store")
    } else {
      // Cache generic category lists for a short time
      response.headers.set("Cache-Control", "public, s-maxage=60")
    }

    return response
  } catch (err) {
    return handleApiError(err)
  }
}

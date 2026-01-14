
import { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { createApiResponse, createApiError, handleApiError } from "@/lib/api-utils"
import { searchRequestSchema } from "@/lib/schemas/search"
import { detectCrisis } from "@/lib/search/crisis"
import { scoreServicesServer } from "@/lib/search/server-scoring"
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
    const { query, locale, filters, options, location } = parsed.data

    // 3. Build Supabase query against services_public view
    // HYBRID STRATEGY: Fetch a larger candidate set (limit=100) then score/sort in memory
    // This allows using complex TypeScript scoring logic (authority, proximity) not easily done in SQL
    let dbQuery = supabase
      .from("services_public")
      .select("*") 
    
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

    // 6. Fetch Candidates
    // Note: We don't perform SQL sorting or precise pagination here.
    // We fetch enough candidates to likely contain the top results after re-scoring.
    const CANDIDATE_LIMIT = 100
    dbQuery = dbQuery.limit(CANDIDATE_LIMIT)

    const { data, error } = await dbQuery

    if (error) {
      console.error("Supabase search error:", error.message) 
      return createApiError("Search failed", 500)
    }

    let services = (data as unknown as ServicePublic[]) || []

    // ROBUSTNESS PATCH: Ensure 988 is always Canada-wide (fixes stale DB data in dev)
    services = services.map(s => {
      if (s.id === "crisis-988") {
        return { ...s, scope: "canada" }
      }
      return s
    })

    // 7. Server-Side Scoring (The "Hybrid" Part)
    // Apply full scoring logic: Authority, Verification, Freshness, Completeness, Proximity, Intent
    let scoredResults = scoreServicesServer(services, query, {
      location,
      locale
    })

    // 8. Crisis Detection & Safety Boost (v14.0/v16.0)
    // If query indicates crisis, ensure crisis services are ALWAYS top regardless of other scores
    const isCrisis = query.trim() && detectCrisis(query)
    if (isCrisis) {
      const crisis = scoredResults.filter(r => r.service.category === "Crisis")
      const nonCrisis = scoredResults.filter(r => r.service.category !== "Crisis")
      // Within the crisis group, original scores (authority etc) still apply
      scoredResults = [...crisis, ...nonCrisis]
    }

    // 9. Pagination (In-Memory)
    const { limit, offset } = options
    const total = scoredResults.length
    const paginatedResults = scoredResults.slice(offset, offset + limit)

    // Extract just the service objects for the response
    const results = paginatedResults.map(r => r.service)

    // 10. Response
    const response = createApiResponse(results, {
      meta: { total, limit, offset } 
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

import { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { createApiResponse, createApiError, handleApiError } from "@/lib/api-utils"
import { searchRequestSchema } from "@/lib/schemas/search"
import { detectCrisis } from "@/lib/search/crisis"
import { isOpenNow } from "@/lib/search/hours"
import { scoreServicesServer } from "@/lib/search/server-scoring"
import { ServicePublic } from "@/types/service-public"
import { trackPerformance } from "@/lib/performance/tracker"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"
import { CircuitOpenError } from "@/lib/resilience/circuit-breaker"
import { isBeyondGovernanceFreshnessWindow } from "@/lib/freshness"

export async function POST(request: NextRequest) {
  return trackPerformance(
    "api.search.total",
    async () => {
      // 1. Rate limiting
      const clientIp = getClientIp(request)
      const rateLimit = await checkRateLimit(clientIp, 60, 60 * 1000, "api:v1:search:services") // 60/min for search
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
        const { query, filters, options, location } = parsed.data

        // 3. Build Supabase query against services_public view
        // Fetch the full filtered candidate set, then apply the shared ranking pipeline in memory.
        // We intentionally avoid SQL text prefiltering here because local ranking uses
        // synthetic_queries and intent-targeting paths that name/description ILIKE alone
        // would miss, breaking local/server parity on the current small curated dataset.
        let dbQuery = supabase.from("services_public").select("*")

        // 4. Apply category filter
        if (filters.category) {
          dbQuery = dbQuery.eq("category", filters.category)
        }

        const { data } = await trackPerformance(
          "api.search.dbQuery",
          async () => {
            try {
              return await withCircuitBreaker(async () => {
                const result = await dbQuery
                if (result.error) throw result.error
                return result
              })
            } catch (err) {
              if (err instanceof CircuitOpenError) {
                // Special error for circuit breaker
                throw err
              }
              throw err
            }
          },
          {
            hasQuery: !!query.trim(),
            hasCategory: !!filters.category,
            hasLocation: !!location,
            openNow: !!filters.openNow,
          }
        )

        let services = (data as unknown as ServicePublic[]) || []

        // ROBUSTNESS PATCH: Ensure 988 is always Canada-wide (fixes stale DB data in dev)
        services = services.map((s) => {
          if (s.id === "crisis-988") {
            return { ...s, scope: "canada" }
          }
          return s
        })
        if (filters.openNow) {
          services = services.filter((service) => isOpenNow(service.hours ?? undefined))
        }
        services = services.filter((service) => !isBeyondGovernanceFreshnessWindow(service))

        // 7. Server-Side Scoring (The "Hybrid" Part)
        // Apply full scoring logic: Authority, Verification, Freshness, Completeness, Proximity, Intent
        let scoredResults = await trackPerformance(
          "api.search.scoring",
          async () => {
            return scoreServicesServer(services, query, {
              location,
              category: filters.category,
              allowFilterOnlyBaseMatch: !query.trim(),
            })
          },
          {
            servicesCount: services.length,
            queryLength: query.length,
          }
        )

        // 8. Crisis Detection & Safety Boost (v14.0/v16.0)
        // If query indicates crisis, ensure crisis services are ALWAYS top regardless of other scores
        const isCrisis = query.trim() && detectCrisis(query)
        if (isCrisis) {
          const crisis = scoredResults.filter((r) => r.service.category === "Crisis")
          const nonCrisis = scoredResults.filter((r) => r.service.category !== "Crisis")
          // Within the crisis group, original scores (authority etc) still apply
          scoredResults = [...crisis, ...nonCrisis]
        }

        // 9. Pagination (In-Memory)
        const { limit, offset } = options
        const total = scoredResults.length
        const paginatedResults = scoredResults.slice(offset, offset + limit)

        // Extract just the service objects for the response
        const results = paginatedResults.map((r) => r.service)

        // 10. Response
        const response = createApiResponse(results, {
          meta: { total, limit, offset },
        })

        // Privacy: cache only anonymous category browse responses.
        if (query.trim() || location || filters.openNow || !filters.category) {
          response.headers.set("Cache-Control", "no-store")
        } else {
          response.headers.set("Cache-Control", "public, s-maxage=60")
        }

        return response
      } catch (err) {
        if (err instanceof CircuitOpenError) {
          return createApiError("Service temporarily unavailable (circuit breaker)", 503)
        }
        return handleApiError(err)
      }
    },
    {
      endpoint: "/api/v1/search/services",
      method: "POST",
    }
  )
}

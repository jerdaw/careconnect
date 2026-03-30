import { VerificationLevel } from "@/types/service"
import { SearchResult, SearchOptions } from "./types"
import { loadServices } from "./data"
import { tokenize } from "./utils"
import { scoreServiceKeyword, WEIGHTS } from "./scoring"
import { cosineSimilarity } from "./vector"
import { resortByDistance, calculateDistanceKm } from "./geo"
import { detectCrisis, boostCrisisResults } from "./crisis"
// import { UserContext } from '@/types/user-context';

import { isOpenNow } from "./hours"
import { expandQuery as expandSynonyms } from "./synonyms"
import { findClosestMatch } from "./levenshtein"
import { getSearchTerms } from "./data"
import { trackPerformance } from "@/lib/performance/tracker"

const SEMANTIC_SIMILARITY_THRESHOLD = 0.01
const SEMANTIC_BOOST_DISPLAY_THRESHOLD = 30
const SEMANTIC_RESCUE_MIN_POINTS = 25

/**
 * Main Hybrid Search Function (Optimized for Cost)
 * Strategy: "Lazy Semantic"
 * 1. Fast Keyword Search first (Free).
 * 2. If good matches found (> threshold), return immediately. Saves API cost.
 * 3. Only fetch Vector (Paid) if keywords fail to find relevant results.
 */
export const searchServices = async (query: string, options: SearchOptions = {}): Promise<SearchResult[]> => {
  return trackPerformance(
    "search.total",
    async () => {
      // 0. AI Query Expansion (Optional)
      let searchInput = query
      if (options.useAIExpansion) {
        await trackPerformance("search.aiExpansion", async () => {
          const { expandQuery: expandQueryAI } = await import("@/lib/ai/query-expander")
          const { expanded } = await expandQueryAI(query)
          if (expanded.length > 0) {
            // Append expanded terms to the query for tokenization
            // We use a lower weight? content scoring treats all tokens roughly equally currently.
            // This is a simple, effective boost.
            searchInput += " " + expanded.join(" ")
          }
        })
      }

      const services = await trackPerformance("search.dataLoad", () => loadServices())
      const rawTokens = tokenize(searchInput)
      const tokens = expandSynonyms(rawTokens)

      // Initial Filter: Category + Open Now
      let filteredServices = services

      if (options.category) {
        filteredServices = filteredServices.filter((s) => s.intent_category === options.category)
      }

      if (options.openNow) {
        filteredServices = filteredServices.filter((s) => isOpenNow(s.hours))
      }

      // Special Case: Empty Query but Category/Location selected
      if (query.trim().length === 0) {
        if (options.category || options.location) {
          // Return everything matching filter
          let results = filteredServices.map((service) => ({
            service,
            score: 1,
            matchReasons: ["Filter Match"],
          }))

          // Sort by Distance if available
          if (options.location) {
            results = results
              .map((r) => {
                if (r.service.coordinates) {
                  const dist = calculateDistanceKm(
                    options.location!.lat,
                    options.location!.lng,
                    r.service.coordinates.lat,
                    r.service.coordinates.lng
                  )
                  return { ...r, distance: dist }
                }
                return { ...r, distance: Infinity }
              })
              .sort((a, b) => {
                const distA = a.distance ?? Infinity
                const distB = b.distance ?? Infinity
                return distA - distB
              })
          }
          return results
        }
        return []
      }

      if (tokens.length === 0) return []

      // 1. First Pass: Keyword Only (Zero Cost)
      let results: SearchResult[] = []

      await trackPerformance(
        "search.keywordScoring",
        async () => {
          for (const service of filteredServices) {
            if (service.verification_level === VerificationLevel.L0) continue

            // Pass userContext to scoring
            const keywordResult = scoreServiceKeyword(service, tokens, options.category, {
              userContext: options.userContext,
            })

            if (keywordResult.score > 0) {
              results.push({ service, score: keywordResult.score, matchReasons: keywordResult.reasons })
            }
          }

          // Sort by Keyword Score
          results.sort((a, b) => b.score - a.score)
        },
        {
          servicesCount: filteredServices.length,
          tokensCount: tokens.length,
        }
      )

      let queryVector: number[] | null = options.vectorOverride || null

      // 2. Cost Optimization & Privacy Check
      if (!options.vectorOverride) {
        // Privacy: We do NOT fetch embeddings from server/OpenAI.
        // If no vector passed from client, we fall back to pure keyword search.

        // Safety Override: Check for Crisis intent
        const isCrisis = detectCrisis(query)
        if (isCrisis) {
          results = boostCrisisResults(results, true)
        }

        // Apply Geo Sort if needed
        if (options.location) {
          return resortByDistance(results, options.location)
        }
        return results
      }

      // 3. Vector Search (Semantic) - Only if client provided embedding
      queryVector = options.vectorOverride

      // We need to re-score or add semantic matches that weren't found by keywords
      const resultsMap = new Map<string, SearchResult>()
      results.forEach((r) => resultsMap.set(r.service.id, r))

      await trackPerformance(
        "search.vectorScoring",
        async () => {
          for (const service of filteredServices) {
            if (service.verification_level === VerificationLevel.L0) continue

            // Use embedding from DB (on service object) OR fallback to local JSON
            // Note: data.ts doesn't export fallbackEmbeddings yet, let's fix that or import directly
            const serviceVector = service.embedding // data.ts already overlays these
            if (!serviceVector) continue

            const similarity = cosineSimilarity(queryVector, serviceVector)

            if (similarity > SEMANTIC_SIMILARITY_THRESHOLD) {
              const vectorPoints = similarity * WEIGHTS.vector

              if (vectorPoints > 0) {
                const existing = resultsMap.get(service.id)

                if (existing) {
                  existing.score += vectorPoints
                  if (vectorPoints > SEMANTIC_BOOST_DISPLAY_THRESHOLD) {
                    existing.matchReasons.push(`Semantic Boost (${Math.round(similarity * 100)}%)`)
                  }
                } else if (vectorPoints > SEMANTIC_RESCUE_MIN_POINTS) {
                  resultsMap.set(service.id, {
                    service,
                    score: vectorPoints,
                    matchReasons: [`Semantic Rescue (${Math.round(similarity * 100)}%)`],
                  })
                }
              }
            }
          }
        },
        {
          servicesCount: filteredServices.length,
          hasEmbedding: true,
        }
      )

      // Convert back to array
      let finalResults = Array.from(resultsMap.values())

      // Sort
      if (options.location) {
        finalResults = resortByDistance(finalResults, options.location)
      } else {
        finalResults.sort((a, b) => b.score - a.score)
      }

      // Safety Override: Check for Crisis intent
      const isCrisis = detectCrisis(query)
      if (isCrisis) {
        finalResults = boostCrisisResults(finalResults, true)
      }

      if (options.limit && options.limit > 0) {
        return finalResults.slice(0, options.limit)
      }

      // Generate suggestion if no results
      if (finalResults.length === 0 && query.trim().length > 2) {
        const searchTerms = await getSearchTerms()
        const suggestion = findClosestMatch(query, searchTerms)
        if (suggestion) {
          options.onSuggestion?.(suggestion)
        }
      }

      return finalResults
    },
    {
      queryLength: query.length,
      hasCategory: !!options.category,
      hasLocation: !!options.location,
      hasVectorOverride: !!options.vectorOverride,
      useAIExpansion: !!options.useAIExpansion,
    }
  )
}

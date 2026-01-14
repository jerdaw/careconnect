/**
 * Server-side scoring wrapper.
 * Applies the same scoring logic as client-side but for ServicePublic objects.
 * v16.0: Search ranking enhancements.
 */
import { ServicePublic } from "@/types/service-public"
import { 
  getAuthorityMultiplier, 
  getCompletenessBoost,
  getVerificationMultiplier,
  getFreshnessMultiplier,
  getIntentTargetingBoost,
  getResourceBoost
} from "./scoring"
import { getProximityMultiplier, calculateDistanceKm } from "./geo"
import { Service, AuthorityTier, VerificationLevel } from "@/types/service"

export interface ServerScoredResult {
  service: ServicePublic
  score: number
  matchReasons: string[]
}

export interface ServerScoringOptions {
  location?: { lat: number; lng: number }
  locale?: string
}

/**
 * Score services for server-side API.
 * Simplified vs client: no semantic matching (no vectors), no intent targeting.
 * Focus: authority, verification, freshness, completeness, proximity.
 */
export function scoreServicesServer(
  services: ServicePublic[],
  query: string,
  options: ServerScoringOptions = {}
): ServerScoredResult[] {
  const results: ServerScoredResult[] = []
  
  for (const service of services) {
    let score = 100 // Base score for keyword match (already filtered by DB)
    const matchReasons: string[] = ["Keyword Match"]
    
    // 1. Verification Level Multiplier
    const verificationMultiplier = getVerificationMultiplier(
      service.verification_status as VerificationLevel
    )
    if (verificationMultiplier !== 1.0) {
      score *= verificationMultiplier
      const boostPercent = Math.round((verificationMultiplier - 1) * 100)
      if (boostPercent > 0) {
        matchReasons.push(`Verification Boost (+${boostPercent}%)`)
      }
    }
    
    // 2. Freshness Multiplier
    const freshnessMultiplier = getFreshnessMultiplier(service.last_verified || undefined)
    if (freshnessMultiplier !== 1.0) {
      score *= freshnessMultiplier
      const boostPercent = Math.round((freshnessMultiplier - 1) * 100)
      if (boostPercent > 0) {
        matchReasons.push(`Fresh Data Boost (+${boostPercent}%)`)
      } else if (boostPercent < 0) {
        matchReasons.push(`Stale Data Penalty (${boostPercent}%)`)
      }
    }
    
    // 3. Authority Tier Multiplier
    const authorityMultiplier = getAuthorityMultiplier(
      service.authority_tier as AuthorityTier
    )
    if (authorityMultiplier !== 1.0) {
      score *= authorityMultiplier
      const boostPercent = Math.round((authorityMultiplier - 1) * 100)
      if (boostPercent > 0) {
        matchReasons.push(`Authority Boost (+${boostPercent}%)`)
      } else if (boostPercent < 0) {
        matchReasons.push(`Authority Penalty (${boostPercent}%)`)
      }
    }
    
    // 4. Completeness Boost (only if base match exists)
    const completenessResult = getCompletenessBoost(service as unknown as Service)
    if (completenessResult.boost > 0) {
      score += completenessResult.boost
      matchReasons.push(...completenessResult.reasons)
    }

    // 5. Intent Targeting Boost (v16.0)
    // Uses synthetic queries from DB view
    if (service.synthetic_queries && service.synthetic_queries.length > 0) {
      const intentResult = getIntentTargetingBoost(service as unknown as Service, query)
      if (intentResult.boost > 0) {
        score += intentResult.boost
        matchReasons.push(...intentResult.reasons)
      }
    }

    // 6. Resource Capacity Boost (v16.0)
    const resourceResult = getResourceBoost(service as unknown as Service)
    if (resourceResult.boost > 0) {
      score += resourceResult.boost
      matchReasons.push(...resourceResult.reasons)
    }
    
      // 7. Proximity Decay (if location provided)
      if (options.location && service.coordinates) {
      const distance = calculateDistanceKm(
        options.location.lat,
        options.location.lng,
        service.coordinates.lat,
        service.coordinates.lng
      )
      
      const isVirtual = service.virtual_delivery === true
      // Use scope logic similar to client-side. ServicePublic has scope.
      const isWideArea = service.scope === "ontario" || service.scope === "canada"
      
      const proximityMultiplier = getProximityMultiplier(
        distance,
        isVirtual,
        isWideArea
      )
      
      score *= proximityMultiplier
      
      // Only show reason if meaningful impact (e.g. < 95% or boosted?)
      // Proximity is usually a penalty (decay).
      if (!isVirtual && proximityMultiplier < 0.99) {
        const proximityPercent = Math.round(proximityMultiplier * 100)
        matchReasons.push(
          `Distance Adjusted (${Math.round(distance)}km, ${proximityPercent}%)`
        )
      }
    }
    
    results.push({ service, score, matchReasons })
  }
  
  // Sort by score descending
  return results.sort((a, b) => b.score - a.score)
}

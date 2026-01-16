import { ScoringWeights } from "./types"
import { Service, VerificationLevel, AuthorityTier } from "@/types/service"
import { normalize } from "./utils"

export const WEIGHTS: ScoringWeights & {
  verificationL3: number
  verificationL2: number
  verificationL1: number
  freshnessRecent: number
  freshnessNormal: number
  freshnessStale: number
  // v16.0: Authority tier multipliers
  authorityGovernment: number
  authorityHealthcare: number
  authorityEstablishedNonprofit: number
  authorityCommunity: number
  authorityUnverified: number
  // v16.0: Completeness boosts
  completenessPhone: number
  completenessAddress: number
  completenessHours: number
  completenessAccessibility: number
  completenessEligibility: number
  completenessApplicationProcess: number
  completenessMax: number
  // v16.0: Intent targeting bonuses
  intentExactMatch: number
  intentHighOverlap: number
  intentMediumOverlap: number
  // v16.0: Resource indicator boosts
  resourceLarge: number
  resourceMedium: number
  resourceSmall: number
} = {
  vector: 100, // Semantic match is the gold standard
  syntheticQuery: 50,
  name: 30,
  identityTag: 20,
  description: 10,
  // Verification and freshness multipliers
  verificationL3: 1.2, // L3 = +20% boost
  verificationL2: 1.1, // L2 = +10% boost
  verificationL1: 1.0, // L1 = baseline
  freshnessRecent: 1.1, // Verified <30 days = +10%
  freshnessNormal: 1.0, // Verified 30-90 days = baseline
  freshnessStale: 0.9, // Verified >90 days = -10%
  // v16.0: Authority tier multipliers
  authorityGovernment: 1.25,
  authorityHealthcare: 1.2,
  authorityEstablishedNonprofit: 1.15,
  authorityCommunity: 1.0,
  authorityUnverified: 0.95,
  // v16.0: Completeness boosts (points)
  completenessPhone: 3,
  completenessAddress: 3,
  completenessHours: 5,
  completenessAccessibility: 3,
  completenessEligibility: 5,
  completenessApplicationProcess: 3,
  completenessMax: 22,
  // v16.0: Intent targeting bonuses (points)
  intentExactMatch: 100,
  intentHighOverlap: 50,
  intentMediumOverlap: 25,
  // v16.0: Resource indicator boosts (points)
  resourceLarge: 15,
  resourceMedium: 8,
  resourceSmall: 3,
}

export interface ScoringOptions {
  weights?: {
    textMatch?: number
    categoryMatch?: number
    distance?: number
    openNow?: number
    emergency?: number
  }
  userContext?: import("@/types/user-context").UserContext
}

export function calculateScore(
  service: Service,
  query: string,
  categoryFilter?: string,
  options: ScoringOptions = {}
): number {
  let score = 0

  // Placeholder logic (from current implementation) - implementation detail omitted
  // This function is still a placeholder in current architecture, primarily used for future server-side scoring

  // 6. Identity Match Boost (Personalization)
  if (options.userContext?.identities.length && service.identity_tags) {
    const matchingTags = service.identity_tags.filter((tag) =>
      options.userContext!.identities.includes(tag.tag.toLowerCase() as any)
    )
    if (matchingTags.length > 0) {
      // 10% boost per matching tag, capped at 30%
      const boostMultiplier = 1 + Math.min(0.3, matchingTags.length * 0.1)
      score *= boostMultiplier
    }
  }

  return score
}

/**
 * Returns a score multiplier based on verification level.
 * Higher verification = higher trust = better ranking.
 */
export function getVerificationMultiplier(level: VerificationLevel): number {
  switch (level) {
    case VerificationLevel.L3:
      return WEIGHTS.verificationL3 // 1.2
    case VerificationLevel.L2:
      return WEIGHTS.verificationL2 // 1.1
    case VerificationLevel.L1:
    case VerificationLevel.L0:
    default:
      return WEIGHTS.verificationL1 // 1.0
  }
}

/**
 * Returns a score multiplier based on how recently the service was verified.
 * Recent verification = more reliable data = better ranking.
 */
export function getFreshnessMultiplier(verifiedAt: string | undefined): number {
  if (!verifiedAt) return WEIGHTS.freshnessStale // No date = assume stale

  const verifiedDate = new Date(verifiedAt)
  if (isNaN(verifiedDate.getTime())) return WEIGHTS.freshnessStale

  const now = new Date()
  const daysSince = Math.floor((now.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSince <= 30) return WEIGHTS.freshnessRecent // 1.1
  if (daysSince <= 90) return WEIGHTS.freshnessNormal // 1.0
  return WEIGHTS.freshnessStale // 0.9
}

/**
 * Returns a score multiplier based on authority tier.
 * Official/government sources are ranked higher.
 * v16.0: Search ranking improvement.
 */
export function getAuthorityMultiplier(tier: AuthorityTier | undefined): number {
  switch (tier) {
    case "government":
      return WEIGHTS.authorityGovernment // 1.25
    case "healthcare":
      return WEIGHTS.authorityHealthcare // 1.20
    case "established_nonprofit":
      return WEIGHTS.authorityEstablishedNonprofit // 1.15
    case "community":
      return WEIGHTS.authorityCommunity // 1.0
    case "unverified":
      return WEIGHTS.authorityUnverified // 0.95
    default:
      return 1.0 // No tier specified = neutral
  }
}

/**
 * Returns bonus points based on data completeness.
 * Services with more actionable information are boosted.
 * v16.0: Search ranking improvement.
 */
export function getCompletenessBoost(service: Service): { boost: number; reasons: string[] } {
  let boost = 0
  const reasons: string[] = []

  if (service.phone) {
    boost += WEIGHTS.completenessPhone
  }
  if (service.address) {
    boost += WEIGHTS.completenessAddress
  }
  if (service.hours && Object.keys(service.hours).length > 0) {
    boost += WEIGHTS.completenessHours
  }
  if (service.accessibility && Object.keys(service.accessibility).length > 0) {
    boost += WEIGHTS.completenessAccessibility
  }
  if (service.eligibility_notes) {
    boost += WEIGHTS.completenessEligibility
  }
  if (service.application_process) {
    boost += WEIGHTS.completenessApplicationProcess
  }

  // Cap at maximum
  boost = Math.min(boost, WEIGHTS.completenessMax)

  if (boost >= 15) {
    reasons.push(`Complete Data (+${boost})`)
  } else if (boost > 0) {
    reasons.push(`Partial Data (+${boost})`)
  }

  return { boost, reasons }
}

/**
 * Returns bonus points based on how closely the query matches synthetic queries.
 * Exact phrase matches get higher bonuses than partial matches.
 * v16.0: Search ranking improvement.
 */
export function getIntentTargetingBoost(service: Service, query: string): { boost: number; reasons: string[] } {
  if (!query.trim()) return { boost: 0, reasons: [] }

  const normalizedQuery = normalize(query)
  const queryTokens = normalizedQuery.split(/\s+/).filter((t) => t.length > 0)

  let boost = 0
  const reasons: string[] = []

  // Check both English and French synthetic queries
  const allSyntheticQueries = [...(service.synthetic_queries || []), ...(service.synthetic_queries_fr || [])]

  for (const syntheticQuery of allSyntheticQueries) {
    const normalizedSynthetic = normalize(syntheticQuery)

    // Exact substring match
    if (normalizedSynthetic.includes(normalizedQuery) || normalizedQuery.includes(normalizedSynthetic)) {
      if (boost < WEIGHTS.intentExactMatch) {
        boost = WEIGHTS.intentExactMatch
        reasons.length = 0
        reasons.push(`Exact Intent Match (+${boost})`)
      }
      break // Found best match
    }

    // Token overlap scoring
    const syntheticTokens = normalizedSynthetic.split(/\s+/).filter((t) => t.length > 0)
    const matchingTokens = queryTokens.filter((token) =>
      syntheticTokens.some((st) => st.includes(token) || token.includes(st))
    )

    const overlapRatio = queryTokens.length > 0 ? matchingTokens.length / queryTokens.length : 0

    if (overlapRatio >= 0.75 && boost < WEIGHTS.intentHighOverlap) {
      boost = WEIGHTS.intentHighOverlap
      reasons.length = 0
      reasons.push(`High Intent Overlap (+${boost})`)
    } else if (overlapRatio >= 0.5 && boost < WEIGHTS.intentMediumOverlap) {
      boost = WEIGHTS.intentMediumOverlap
      reasons.length = 0
      reasons.push(`Intent Overlap (+${boost})`)
    }
  }

  return { boost, reasons }
}

/**
 * Returns bonus points based on resource indicators.
 * Services with greater capacity/resources get small boosts.
 * v16.0: Search ranking improvement.
 */
export function getResourceBoost(service: Service): { boost: number; reasons: string[] } {
  const indicators = service.resource_indicators
  if (!indicators) return { boost: 0, reasons: [] }

  let boost = 0
  const reasons: string[] = []

  // Staff size boost
  if (indicators.staff_size === "large") {
    boost += WEIGHTS.resourceLarge
  } else if (indicators.staff_size === "medium") {
    boost += WEIGHTS.resourceMedium
  } else if (indicators.staff_size === "small") {
    boost += WEIGHTS.resourceSmall
  }

  // Budget boost
  if (indicators.annual_budget === "large") {
    boost += WEIGHTS.resourceLarge
  } else if (indicators.annual_budget === "medium") {
    boost += WEIGHTS.resourceMedium
  } else if (indicators.annual_budget === "small") {
    boost += WEIGHTS.resourceSmall
  }

  // Service area boost
  if (indicators.service_area_size === "national") {
    boost += WEIGHTS.resourceLarge
  } else if (indicators.service_area_size === "provincial") {
    boost += WEIGHTS.resourceMedium
  } else if (indicators.service_area_size === "regional" || indicators.service_area_size === "local") {
    boost += WEIGHTS.resourceSmall
  }

  if (boost > 0) {
    reasons.push(`Resource Capacity (+${boost})`)
  }

  return { boost, reasons }
}

/**
 * Calculates a match score for a single service against a normalized query tokens.
 */
export const scoreServiceKeyword = (
  service: Service,
  tokens: string[],
  categoryFilter?: string,
  options: ScoringOptions = {}
): { score: number; reasons: string[] } => {
  let score = 0
  const matchReasons: string[] = []

  // 1a. Check Synthetic Queries (English) - High Impact
  if (service.synthetic_queries) {
    for (const query of service.synthetic_queries) {
      const queryText = normalize(query)
      let queryMatches = 0

      for (const token of tokens) {
        if (queryText.includes(token)) {
          queryMatches++
        }
      }

      if (queryMatches > 0) {
        const points = WEIGHTS.syntheticQuery * queryMatches
        score += points
        matchReasons.push(`Matched intent: "${query}" (+${points})`)
        break
      }
    }
  }

  // 1b. Check Synthetic Queries (French) - High Impact
  if (service.synthetic_queries_fr) {
    for (const query of service.synthetic_queries_fr) {
      const queryText = normalize(query)
      let queryMatches = 0

      for (const token of tokens) {
        if (queryText.includes(token)) {
          queryMatches++
        }
      }

      if (queryMatches > 0) {
        const points = WEIGHTS.syntheticQuery * queryMatches
        score += points
        matchReasons.push(`Matched intent (FR): "${query}" (+${points})`)
        break
      }
    }
  }

  // 2. Check Name (Medium Impact) - English & French
  const nameText = normalize(service.name)
  const nameFrText = service.name_fr ? normalize(service.name_fr) : ""

  for (const token of tokens) {
    if (nameText.includes(token)) {
      score += WEIGHTS.name
      matchReasons.push(`Matched name: "${service.name}" (+${WEIGHTS.name})`)
    } else if (nameFrText && nameFrText.includes(token)) {
      score += WEIGHTS.name
      matchReasons.push(`Matched name (FR): "${service.name_fr}" (+${WEIGHTS.name})`)
    }
  }

  // 3. Check Identity Tags (Boost)
  if (service.identity_tags) {
    for (const identity of service.identity_tags) {
      const tagText = normalize(identity.tag)
      for (const token of tokens) {
        if (tagText.includes(token)) {
          score += WEIGHTS.identityTag
          matchReasons.push(`Matched tag: "${identity.tag}" (+${WEIGHTS.identityTag})`)
        }
      }
    }
  }

  // 4. Check Description (Low Impact / Catch-all) - English & French
  const descText = normalize(service.description)
  const descFrText = service.description_fr ? normalize(service.description_fr) : ""
  let descScore = 0

  for (const token of tokens) {
    if (descText.includes(token)) {
      descScore += WEIGHTS.description
    } else if (descFrText && descFrText.includes(token)) {
      descScore += WEIGHTS.description
    }
  }

  if (descScore > 0) {
    score += descScore
    matchReasons.push(`Matched description (+${descScore})`)
  }

  // 5. Identity Match Boost (Personalization)
  if (options.userContext?.identities.length && service.identity_tags) {
    const matchingTags = service.identity_tags.filter((tag) =>
      options.userContext!.identities.includes(tag.tag.toLowerCase() as import("@/types/user-context").IdentityTag)
    )
    if (matchingTags.length > 0) {
      // 10% boost per matching tag, capped at 30%
      const boostMultiplier = 1 + Math.min(0.3, matchingTags.length * 0.1)
      score *= boostMultiplier
      const boostPercent = Math.round((boostMultiplier - 1) * 100)
      matchReasons.push(`Identity Boost (+${boostPercent}%)`)
    }
  }

  // 6. Verification Level Boost
  const verificationMultiplier = getVerificationMultiplier(service.verification_level)
  if (verificationMultiplier !== 1.0) {
    score *= verificationMultiplier
    const boostPercent = Math.round((verificationMultiplier - 1) * 100)
    if (boostPercent > 0) {
      matchReasons.push(`Verification Boost (+${boostPercent}%)`)
    }
  }

  // 7. Freshness Boost
  const verifiedAt = service.provenance?.verified_at || service.last_verified
  const freshnessMultiplier = getFreshnessMultiplier(verifiedAt)
  if (freshnessMultiplier !== 1.0) {
    score *= freshnessMultiplier
    const boostPercent = Math.round((freshnessMultiplier - 1) * 100)
    if (boostPercent > 0) {
      matchReasons.push(`Fresh Data Boost (+${boostPercent}%)`)
    } else if (boostPercent < 0) {
      matchReasons.push(`Stale Data Penalty (${boostPercent}%)`)
    }
  }

  // 8. Authority Tier Boost (v16.0)
  const authorityMultiplier = getAuthorityMultiplier(service.authority_tier)
  if (authorityMultiplier !== 1.0) {
    score *= authorityMultiplier
    const boostPercent = Math.round((authorityMultiplier - 1) * 100)
    if (boostPercent > 0) {
      matchReasons.push(`Authority Boost (+${boostPercent}%)`)
    } else if (boostPercent < 0) {
      matchReasons.push(`Authority Penalty (${boostPercent}%)`)
    }
  }

  // Only apply additive boosts if there's already a base match
  // This prevents services from appearing in results without any keyword/semantic relevance
  const hasBaseMatch = score > 0

  // 9. Data Completeness Boost (v16.0)
  // Only apply if service already matched on keywords
  if (hasBaseMatch) {
    const completenessResult = getCompletenessBoost(service)
    if (completenessResult.boost > 0) {
      score += completenessResult.boost
      matchReasons.push(...completenessResult.reasons)
    }
  }

  // 10. Intent Targeting Boost (v16.0)
  // Uses the original query string from options if available
  const originalQuery = options.userContext?.identities ? tokens.join(" ") : tokens.join(" ")
  const intentResult = getIntentTargetingBoost(service, originalQuery)
  if (intentResult.boost > 0) {
    score += intentResult.boost
    matchReasons.push(...intentResult.reasons)
  }

  // 11. Resource Capacity Boost (v16.0)
  // Only apply if service already matched on keywords
  if (hasBaseMatch) {
    const resourceResult = getResourceBoost(service)
    if (resourceResult.boost > 0) {
      score += resourceResult.boost
      matchReasons.push(...resourceResult.reasons)
    }
  }

  return { score, reasons: matchReasons }
}

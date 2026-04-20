import { ScoringWeights, SearchResult } from "./types"
import { Service, VerificationLevel, AuthorityTier } from "@/types/service"
import { normalize } from "./utils"
import { getFreshnessLevel } from "@/lib/freshness"
import { tokenize } from "./utils"
import { expandQuery as expandSynonyms } from "./synonyms"
import { detectCrisis, boostCrisisResults } from "./crisis"
import { resortByDistance } from "./geo"

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

import type { IdentityTag } from "@/types/user-context"

const VALID_IDENTITY_TAGS: readonly IdentityTag[] = ["indigenous", "newcomer", "2slgbtqi+", "veteran", "disability"]

function isIdentityTag(value: string): value is IdentityTag {
  return VALID_IDENTITY_TAGS.includes(value as IdentityTag)
}

function isSubstringMatch(a: string, b: string): boolean {
  return a.includes(b) || b.includes(a)
}

/**
 * Calculates the proportion of query tokens that meaningfully match service tokens.
 * Returns a value between 0 and 1.
 */
function calculateTokenOverlap(queryTokens: string[], serviceTokens: string[]): number {
  if (queryTokens.length === 0) return 0

  let matchCount = 0
  for (const qToken of queryTokens) {
    // A token matches if it's a substring of any service token or vice versa
    if (serviceTokens.some((sToken) => isSubstringMatch(sToken, qToken))) {
      matchCount++
    }
  }

  return matchCount / queryTokens.length
}

function scoreSyntheticQueries(
  queries: string[] | undefined,
  tokens: string[],
  languageLabel: string
): { score: number; matchedQuery: string | null } {
  if (!queries) return { score: 0, matchedQuery: null }

  for (const query of queries) {
    const queryText = normalize(query)
    let matchCount = 0

    for (const token of tokens) {
      if (queryText.includes(token)) {
        matchCount++
      }
    }

    if (matchCount > 0) {
      return {
        score: WEIGHTS.syntheticQuery * matchCount,
        matchedQuery: `Matched intent${languageLabel}: "${query}"`,
      }
    }
  }

  return { score: 0, matchedQuery: null }
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
  allowFilterOnlyBaseMatch?: boolean
}

export function calculateScore(
  service: Service,
  query: string,
  categoryFilter?: string,
  options: ScoringOptions = {}
): number {
  const tokens = expandSynonyms(tokenize(query))
  return scoreServiceKeyword(service, tokens, categoryFilter, {
    ...options,
    allowFilterOnlyBaseMatch: options.allowFilterOnlyBaseMatch,
  }).score
}

export interface RankServicesOptions {
  category?: string
  location?: { lat: number; lng: number }
  userContext?: import("@/types/user-context").UserContext
  allowFilterOnlyBaseMatch?: boolean
}

export function rankServicesByQuery(
  services: Service[],
  query: string,
  options: RankServicesOptions = {}
): SearchResult[] {
  const tokens = expandSynonyms(tokenize(query))

  let results = services
    .map((service) => ({
      service,
      ...(() => {
        const ranked = scoreServiceKeyword(service, tokens, options.category, {
          userContext: options.userContext,
          allowFilterOnlyBaseMatch: options.allowFilterOnlyBaseMatch,
        })

        return {
          score: ranked.score,
          matchReasons: ranked.reasons,
        }
      })(),
    }))
    .filter((result) => result.score > 0)

  results.sort((a, b) => b.score - a.score)

  if (options.location) {
    results = resortByDistance(results, options.location)
  }

  if (query.trim() && detectCrisis(query)) {
    results = boostCrisisResults(results, true)
  }

  return results
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
  const freshnessLevel = getFreshnessLevel(verifiedAt)

  if (freshnessLevel === "fresh") return WEIGHTS.freshnessRecent
  if (freshnessLevel === "recent") return WEIGHTS.freshnessNormal
  return WEIGHTS.freshnessStale
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
 * Requires meaningful token overlap - short single-token matches are limited to prevent
 * queries like "clinic" from dominating results.
 * v16.0: Search ranking improvement.
 * v17.7: Fixed to require meaningful overlap, with special handling for long single tokens.
 */
export function getIntentTargetingBoost(service: Service, query: string): { boost: number; reasons: string[] } {
  if (!query.trim()) return { boost: 0, reasons: [] }

  const normalizedQuery = normalize(query)
  const queryTokens = normalizedQuery.split(/\s+/).filter((t) => t.length > 2) // Filter short tokens

  if (queryTokens.length === 0) return { boost: 0, reasons: [] }

  let boost = 0
  const reasons: string[] = []

  // Check both English and French synthetic queries
  const allSyntheticQueries = [...(service.synthetic_queries || []), ...(service.synthetic_queries_fr || [])]

  // Special case: single long token (6+ chars like "depression", "counselling", "homeless")
  // These are specific enough to warrant intent matching, but at reduced boost
  const firstToken = queryTokens[0]
  const isSingleLongToken = queryTokens.length === 1 && firstToken !== undefined && firstToken.length >= 6

  for (const syntheticQuery of allSyntheticQueries) {
    const normalizedSynthetic = normalize(syntheticQuery)
    const syntheticTokens = normalizedSynthetic.split(/\s+/).filter((t) => t.length > 2)

    if (isSingleLongToken && firstToken) {
      // For single long tokens, check if the token appears in the synthetic query
      // Award medium overlap at most (not exact or high) to prevent gaming
      if (syntheticTokens.some((st) => isSubstringMatch(st, firstToken))) {
        if (boost < WEIGHTS.intentMediumOverlap) {
          boost = WEIGHTS.intentMediumOverlap
          reasons.length = 0
          reasons.push(`Intent Overlap (+${boost})`)
        }
      }
      continue
    }

    // Multi-token queries: Calculate bidirectional token overlap
    const queryOverlap = calculateTokenOverlap(queryTokens, syntheticTokens)
    const syntheticOverlap = calculateTokenOverlap(syntheticTokens, queryTokens)

    // Exact match: both query and synthetic have very high overlap (90%+)
    // This prevents "clinic" from matching "walk in clinic for immigrants" as exact
    if (queryOverlap >= 0.9 && syntheticOverlap >= 0.5 && boost < WEIGHTS.intentExactMatch) {
      boost = WEIGHTS.intentExactMatch
      reasons.length = 0
      reasons.push(`Exact Intent Match (+${boost})`)
    }
    // High overlap: 75%+ of query tokens match AND at least 40% of synthetic tokens match
    else if (queryOverlap >= 0.75 && syntheticOverlap >= 0.4 && boost < WEIGHTS.intentHighOverlap) {
      boost = WEIGHTS.intentHighOverlap
      reasons.length = 0
      reasons.push(`High Intent Overlap (+${boost})`)
    }
    // Medium overlap: 50%+ of query tokens match AND at least 30% of synthetic tokens match
    else if (queryOverlap >= 0.5 && syntheticOverlap >= 0.3 && boost < WEIGHTS.intentMediumOverlap) {
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

  if (tokens.length === 0) {
    if (!options.allowFilterOnlyBaseMatch) {
      return { score: 0, reasons: [] }
    }

    score = 1
    matchReasons.push("Filter Match")
  }

  // 1. Check Synthetic Queries (English + French) - High Impact
  if (tokens.length > 0) {
    const englishResult = scoreSyntheticQueries(service.synthetic_queries, tokens, "")
    if (englishResult.score > 0) {
      score += englishResult.score
      matchReasons.push(`${englishResult.matchedQuery} (+${englishResult.score})`)
    }

    const frenchResult = scoreSyntheticQueries(service.synthetic_queries_fr, tokens, " (FR)")
    if (frenchResult.score > 0) {
      score += frenchResult.score
      matchReasons.push(`${frenchResult.matchedQuery} (+${frenchResult.score})`)
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
  // v17.7: Require at least 2 token matches in description to count
  // This prevents false positives like "free hot meal" matching "Pro Bono (free legal)"
  const descText = normalize(service.description)
  const descFrText = service.description_fr ? normalize(service.description_fr) : ""
  let descMatchCount = 0
  let descScore = 0

  for (const token of tokens) {
    if (descText.includes(token)) {
      descMatchCount++
      descScore += WEIGHTS.description
    } else if (descFrText && descFrText.includes(token)) {
      descMatchCount++
      descScore += WEIGHTS.description
    }
  }

  // Only add description score if we matched at least 2 tokens
  // OR if the token is very specific (4+ characters)
  const hasSpecificToken = tokens.some((t) => t.length >= 4 && (descText.includes(t) || descFrText.includes(t)))
  if (descMatchCount >= 2 || hasSpecificToken) {
    score += descScore
    matchReasons.push(`Matched description (+${descScore})`)
  }

  // 5. Identity Match Boost (Personalization)
  if (options.userContext?.identities.length && service.identity_tags) {
    const matchingTags = service.identity_tags.filter((tag) => {
      const normalizedTag = tag.tag.toLowerCase()
      return isIdentityTag(normalizedTag) && options.userContext!.identities.includes(normalizedTag)
    })
    if (matchingTags.length > 0) {
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

  // 8. Authority Tier Boost (v16.0, refined v17.7)
  // Only apply authority multiplier when there's meaningful relevance
  // This prevents hospitals from dominating results for unrelated queries like "free food"
  const AUTHORITY_RELEVANCE_THRESHOLD = 30 // Minimum score before authority boost applies
  const authorityMultiplier = getAuthorityMultiplier(service.authority_tier)
  if (authorityMultiplier !== 1.0 && score >= AUTHORITY_RELEVANCE_THRESHOLD) {
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
  const originalQuery = tokens.join(" ")
  if (originalQuery.trim()) {
    const intentResult = getIntentTargetingBoost(service, originalQuery)
    if (intentResult.boost > 0) {
      score += intentResult.boost
      matchReasons.push(...intentResult.reasons)
    }
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

import { ScoringWeights } from "./types"
import { Service, VerificationLevel } from "@/types/service"
import { normalize } from "./utils"

export const WEIGHTS: ScoringWeights & {
  verificationL3: number
  verificationL2: number
  verificationL1: number
  freshnessRecent: number
  freshnessNormal: number
  freshnessStale: number
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const daysSince = Math.floor(
    (now.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSince <= 30) return WEIGHTS.freshnessRecent // 1.1
  if (daysSince <= 90) return WEIGHTS.freshnessNormal // 1.0
  return WEIGHTS.freshnessStale // 0.9
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      options.userContext!.identities.includes(tag.tag.toLowerCase() as any)
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
  const verificationMultiplier = getVerificationMultiplier(
    service.verification_level
  )
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

  return { score, reasons: matchReasons }
}

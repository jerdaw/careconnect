import type { UserContext, EligibilityCriteria, EligibilityStatus, IdentityTag } from "@/types/user-context"
import type { Service } from "@/types/service"

const AGE_GROUP_BOUNDARIES = {
  youth: { min: 0, max: 29 },
  adult: { min: 18, max: 64 },
  senior: { min: 55, max: 120 },
} as const

const AGE_RANGE_PATTERN = /Ages?\s*(\d+)(?:\s*[-–]\s*(\d+))?/i

const IDENTITY_PATTERNS: readonly [RegExp, IdentityTag][] = [
  [/indigenous|first nations|metis|inuit/i, "indigenous"],
  [/newcomer|immigrant|refugee/i, "newcomer"],
  [/2slgbtqi\+|lgbtq|trans|queer/i, "2slgbtqi+"],
  [/veteran|military/i, "veteran"],
  [/disability|disabled/i, "disability"],
]

function extractAgeRange(notes: string): { minAge?: number; maxAge?: number } {
  const ageMatch = notes.match(AGE_RANGE_PATTERN)
  if (ageMatch && ageMatch[1]) {
    return {
      minAge: parseInt(ageMatch[1], 10),
      maxAge: ageMatch[2] ? parseInt(ageMatch[2], 10) : undefined,
    }
  }

  const result: { minAge?: number; maxAge?: number } = {}
  if (/youth|jeune/i.test(notes)) {
    result.maxAge = 29
  }
  if (/senior|aîné|elder/i.test(notes)) {
    result.minAge = 55
  }
  return result
}

function extractRequiredIdentities(notes: string): IdentityTag[] {
  return IDENTITY_PATTERNS.filter(([pattern]) => pattern.test(notes)).map(([, tag]) => tag)
}

export function parseEligibility(notes: string): EligibilityCriteria {
  const criteria: EligibilityCriteria = {}

  const ageRange = extractAgeRange(notes)
  if (ageRange.minAge !== undefined) criteria.minAge = ageRange.minAge
  if (ageRange.maxAge !== undefined) criteria.maxAge = ageRange.maxAge

  const identities = extractRequiredIdentities(notes)
  if (identities.length > 0) {
    criteria.requiredIdentities = identities
  }

  return criteria
}

export function checkEligibility(service: Service, context: UserContext): EligibilityStatus {
  if (!context.hasOptedIn || !service.eligibility_notes) return "unknown"

  const criteria = parseEligibility(service.eligibility_notes)
  const userAge = context.ageGroup ? AGE_GROUP_BOUNDARIES[context.ageGroup] : null

  // Age check
  if (criteria.minAge && userAge && userAge.max < criteria.minAge) return "ineligible"
  if (criteria.maxAge && userAge && userAge.min > criteria.maxAge) return "ineligible"

  // Identity check
  if (criteria.requiredIdentities?.length) {
    const hasRequired = criteria.requiredIdentities.some((tag) => context.identities.includes(tag))
    if (!hasRequired) return "ineligible"
  }

  return "eligible"
}

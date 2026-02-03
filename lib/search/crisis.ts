import { SearchResult } from "./types"

const CRISIS_SAFETY_BOOST_POINTS = 1000

// Keywords that indicate a potential crisis or safety risk
export const CRISIS_KEYWORDS = [
  // Suicide & self-harm
  "suicide",
  "suicidal",
  "kill myself",
  "killing myself",
  "want to die",
  "end my life",
  "help me die",
  "hanging myself",
  "cutting myself",
  "hurt myself",
  "self harm",
  "overdose",
  // Violence & abuse
  "abuse",
  "violence",
  "assault",
  "rape",
  "domestic violence",
  "beat me",
  "beating me",
  "hits me",
  "hitting me",
  "scared at home",
  // General crisis
  "crisis",
  "emergency",
]

/**
 * Detects if a query contains crisis-related keywords.
 */
export function detectCrisis(query: string): boolean {
  if (!query) return false
  const lowerQuery = query.toLowerCase()
  return CRISIS_KEYWORDS.some((keyword) => lowerQuery.includes(keyword))
}

/**
 * Boosts crisis services to the top of the results if a crisis is detected.
 * Ensures at least one crisis service is visible if available.
 */
export function boostCrisisResults(results: SearchResult[], isCrisis: boolean): SearchResult[] {
  if (!isCrisis) return results

  const crisisResults = results.filter((r) => r.service.intent_category === "Crisis")
  const nonCrisis = results.filter((r) => r.service.intent_category !== "Crisis")

  // If we found crisis results, put them at the top
  if (crisisResults.length > 0) {
    crisisResults.forEach((r) => {
      r.score += CRISIS_SAFETY_BOOST_POINTS
      r.matchReasons.push("Crisis Detected (Safety Boost)")
    })

    // Return crisis first, then the rest
    return [...crisisResults, ...nonCrisis]
  }

  return results
}

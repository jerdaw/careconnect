import { levenshteinDistance } from "./utils"

export const DICTIONARY = [
  // Categories
  "food",
  "housing",
  "shelter",
  "health",
  "mental",
  "dental",
  "legal",
  "employment",
  "crisis",

  // Local Agencies & Acronyms
  "kchc",
  "iska",
  "amhs",
  "cmha",
  "martha",
  "marthas",
  "partner",
  "mission",
  "salvation",
  "army",
  "maltby",
  "hospice",
  "providence",
  "hotel",
  "dieu",
  "interval",
  "house",
  "dawn",
  "access",
  "bus",

  // Neighborhoods/Locations
  "downtown",
  "north",
  "end",
  "west",
  "east",
  "rideau",
  "heights",
  "kingscourt",
  "cataraqui",
  "pittsburgh",
  "sydenham",

  // Common Needs
  "hungry",
  "starving",
  "homeless",
  "eviction",
  "rent",
  "subsidy",
  "utility",
  "hydro",
  "doctor",
  "nurse",
  "pill",
  "prescription",
  "addiction",
  "rehab",
  "detox",
  "suicide",
  "help",
  "emergency",
  "urgent",
]

/**
 * Returns a suggested query if the current query seems to have a typo
 */
export const getSuggestion = (query: string): string | null => {
  if (!query || query.length < 3) return null

  const words = query.toLowerCase().split(/\s+/)
  let changed = false

  const suggestedWords = words.map((word) => {
    // Only try to correct words that are at least 3 chars and not purely numeric
    if (word.length < 3 || /^\d+$/.test(word)) return word
    if (DICTIONARY.includes(word)) return word

    let bestMatch = word
    let minDistance = 2 // Threshold for suggestion (1 char diff for small words)

    for (const term of DICTIONARY) {
      const dist = levenshteinDistance(word, term)
      if (dist < minDistance) {
        minDistance = dist
        bestMatch = term
      }
    }

    if (bestMatch !== word) {
      changed = true
    }
    return bestMatch
  })

  return changed ? suggestedWords.join(" ") : null
}

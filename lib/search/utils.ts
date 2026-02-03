/**
 * Normalizes text for comparison: lowercases and removes punctuation.
 */
export const normalize = (text: string): string => {
  return text.toLowerCase().replace(/[^\w\s]/g, "")
}

/**
 * Tokenizes a query string into an array of words, removing common stop words (English & French).
 */
export const tokenize = (query: string): string[] => {
  const stopWords = new Set([
    // English
    "a",
    "an",
    "the",
    "in",
    "on",
    "at",
    "for",
    "to",
    "of",
    "and",
    "is",
    "are",
    "i",
    "need",
    "help",
    "want",
    "where",
    "can",
    "get",
    // French
    "le",
    "la",
    "les",
    "un",
    "une",
    "de",
    "des",
    "en",
    "et",
    "est",
    "a",
    "il",
    "elle",
    "je",
    "tu",
    "nous",
    "vous",
    "ils",
    "pour",
    "sur",
    "dans",
    "avec",
    "qui",
    "que",
    "si",
    "ou",
  ])

  // Important short abbreviations that should NOT be filtered out
  const allowedShortTerms = new Set([
    "ow", // Ontario Works
    "er", // Emergency Room
    "aa", // Alcoholics Anonymous
    "na", // Narcotics Anonymous
    "hiv", // Though 3 chars, included for clarity
    "std", // Sexually Transmitted Disease
    "sti", // Sexually Transmitted Infection
  ])

  return normalize(query)
    .split(/\s+/)
    .filter((word) => (word.length > 2 || allowedShortTerms.has(word)) && !stopWords.has(word))
}

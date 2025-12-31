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
  return normalize(query)
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word)) // Filter short words and stop words
}

/**
 * Simple Levenshtein distance for fuzzy matching
 */
export const levenshteinDistance = (a: string, b: string): number => {
  const matrix = Array.from({ length: a.length + 1 }, () => Array.from({ length: b.length + 1 }, (_, i) => i))
  for (let i = 0; i <= a.length; i++) matrix[i]![0] = i

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i]![j] = Math.min(matrix[i - 1]![j]! + 1, matrix[i]![j - 1]! + 1, matrix[i - 1]![j - 1]! + cost)
    }
  }
  return matrix[a.length]![b.length]!
}

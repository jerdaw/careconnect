/**
 * Calculate Levenshtein distance between two strings.
 * Optimized single-row implementation.
 */
export function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix: number[] = Array.from({ length: b.length + 1 }, (_, i) => i)

  for (let i = 1; i <= a.length; i++) {
    let prev = i
    for (let j = 1; j <= b.length; j++) {
      const curr = a[i - 1] === b[j - 1]
        ? matrix[j - 1]!
        : Math.min(matrix[j - 1]!, matrix[j]!, prev) + 1
      matrix[j - 1] = prev
      prev = curr
    }
    matrix[b.length] = prev
  }
  return matrix[b.length]!
}

/**
 * Find the closest match from a list of candidates.
 * Returns null if no match is within the threshold.
 */
export function findClosestMatch(
  query: string,
  candidates: string[],
  maxDistance = 2
): string | null {
  const normalized = query.toLowerCase().trim()
  let best: { term: string; distance: number } | null = null

  for (const candidate of candidates) {
    const dist = levenshtein(normalized, candidate.toLowerCase())
    if (dist <= maxDistance && (!best || dist < best.distance)) {
      best = { term: candidate, distance: dist }
    }
  }
  return best?.term ?? null
}

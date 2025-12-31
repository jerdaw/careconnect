/**
 * Escapes special characters for regex
 */
function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Highlights matching tokens in text by wrapping them in <mark> tags.
 * Case-insensitive match.
 */
export function highlightMatches(text: string, tokens: string[]): string {
  if (!text || !tokens || tokens.length === 0) return text

  let result = text
  // Sort tokens by length (descending) to match longer phrases first if overlapping
  const sortedTokens = [...tokens].sort((a, b) => b.length - a.length)

  // Create a single regex for all tokens
  const pattern = sortedTokens.map(escapeRegex).join("|")
  const regex = new RegExp(`(${pattern})`, "gi")

  // Replace with mark tag (using a unique placeholder to avoid re-highlighting inside tags if multiple passes)
  // Actually, simple pass is usually enough for this MVP
  result = result.replace(
    regex,
    '<mark class="bg-yellow-200 dark:bg-yellow-900/50 text-inherit px-0.5 rounded">$1</mark>'
  )

  return result
}

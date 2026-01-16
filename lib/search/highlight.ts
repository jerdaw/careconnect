/**
 * Escapes HTML special characters to prevent XSS.
 * Must be called before any HTML content is injected.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

/**
 * Escapes special characters for regex
 */
function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Highlights matching tokens in text by wrapping them in <mark> tags.
 * Case-insensitive match.
 *
 * Security: HTML entities are escaped FIRST to prevent XSS,
 * then highlighting is applied.
 */
export function highlightMatches(text: string, tokens: string[]): string {
  if (!text) return ""

  // SECURITY: Always escape HTML first to prevent XSS
  let result = escapeHtml(text)

  if (!tokens || tokens.length === 0) return result

  // Sort tokens by length (descending) to match longer phrases first if overlapping
  const sortedTokens = [...tokens].sort((a, b) => b.length - a.length)

  // Create a single regex for all tokens (escape both regex and HTML in tokens)
  const pattern = sortedTokens.map((t) => escapeRegex(escapeHtml(t))).join("|")
  const regex = new RegExp(`(${pattern})`, "gi")

  // Replace with mark tag
  result = result.replace(
    regex,
    '<mark class="bg-yellow-200 dark:bg-yellow-900/50 text-inherit px-0.5 rounded">$1</mark>'
  )

  return result
}

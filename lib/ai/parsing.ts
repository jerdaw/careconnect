import { RefinedSearchQuery } from "./engine"

/**
 * Sanitizes model output to remove common instruction-tuning leakage patterns.
 */
export function sanitizeModelOutput(text: string): string {
  const leakMarkers = ["Instruction 2 (More difficult with added constraints):", "Instruction 2:"]
  for (const marker of leakMarkers) {
    const idx = text.indexOf(marker)
    if (idx >= 0) return text.slice(0, idx).trim()
  }
  return text.trim()
}

/**
 * Parses the raw AI response for search query refinement.
 */
export function parseRefinedQuery(text: string, userQuery: string): RefinedSearchQuery | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  let parsed: any
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/)
    if (!match) return null
    try {
      parsed = JSON.parse(match[0])
    } catch {
      return null
    }
  }

  if (!parsed || typeof parsed !== "object") return null
  const obj = parsed as Record<string, any>

  const query = typeof obj.query === "string" ? obj.query.trim() : ""
  const termsRaw = Array.isArray(obj.terms) ? obj.terms : []
  const terms = termsRaw
    .filter((t: any): t is string => typeof t === "string")
    .map((t: string) => t.trim())
    .filter(Boolean)
    .slice(0, 8)

  if (!query && terms.length === 0) return null

  const category = typeof obj.category === "string" ? obj.category.trim() : undefined
  const needsClarification = typeof obj.needsClarification === "boolean" ? obj.needsClarification : undefined
  const clarifyingQuestion = typeof obj.clarifyingQuestion === "string" ? obj.clarifyingQuestion.trim() : undefined

  return {
    query: query || userQuery,
    terms,
    ...(category ? { category } : {}),
    ...(needsClarification !== undefined ? { needsClarification } : {}),
    ...(clarifyingQuestion ? { clarifyingQuestion } : {}),
  }
}

/**
 * Parses the raw AI response for query expansion.
 */
export function parseExpandedQuery(text: string): string[] {
  let parsed: any
  try {
    parsed = JSON.parse(text)
    if (!Array.isArray(parsed)) throw new Error("Not an array")
  } catch {
    // Attempt to extract array from response
    const match = text.match(/\[.*\]/s)
    parsed = match ? (JSON.parse(match[0]) as string[]) : []
  }

  if (!Array.isArray(parsed)) return []

  // Sanitize results (max 5, no duplicates, no empty strings)
  const filtered = (parsed as any[])
    .filter((t: any): t is string => typeof t === "string" && !!t.trim())
    .map((t: string) => t.trim())

  return [...new Set(filtered)].slice(0, 5)
}

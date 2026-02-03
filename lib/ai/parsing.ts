import { RefinedSearchQuery } from "./engine"

function tryParseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

function extractJsonObject(text: string): Record<string, unknown> | null {
  const direct = tryParseJson<Record<string, unknown>>(text)
  if (direct && typeof direct === "object") return direct

  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null

  return tryParseJson<Record<string, unknown>>(match[0])
}

function extractJsonArray(text: string): unknown[] | null {
  const direct = tryParseJson<unknown[]>(text)
  if (Array.isArray(direct)) return direct

  const match = text.match(/\[.*\]/s)
  if (!match) return null

  return tryParseJson<unknown[]>(match[0])
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

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

  const parsed = extractJsonObject(trimmed)
  if (!parsed) return null

  const obj = parsed as Record<string, unknown>

  const query = typeof obj.query === "string" ? obj.query.trim() : ""
  const termsRaw = Array.isArray(obj.terms) ? obj.terms : []
  const terms = termsRaw
    .filter(isNonEmptyString)
    .map((t) => t.trim())
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
  const parsed = extractJsonArray(text)
  if (!parsed) return []

  const filtered = parsed.filter(isNonEmptyString).map((t) => t.trim())

  return [...new Set(filtered)].slice(0, 5)
}

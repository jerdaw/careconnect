import { aiEngine } from "./engine"

const EXPANSION_PROMPT = `You are a social services search assistant for Kingston, Ontario. Given a user query, generate 3-5 semantically related search terms that would help find relevant community services.

Rules:
- Output ONLY a JSON array of strings, nothing else.
- Include synonyms, related concepts, and specific service types.
- Consider local Canadian terminology (e.g., "ODSP" for disability, "OW" for Ontario Works).

User Query: "{query}"
Related Terms:`

export interface QueryExpansionResult {
  original: string
  expanded: string[]
  fromCache: boolean
}

// Simple in-memory cache to avoid redundant LLM calls
const expansionCache = new Map<string, string[]>()

export async function expandQuery(query: string): Promise<QueryExpansionResult> {
  const normalizedQuery = query.toLowerCase().trim()

  // Check cache first
  if (expansionCache.has(normalizedQuery)) {
    return {
      original: query,
      expanded: expansionCache.get(normalizedQuery)!,
      fromCache: true,
    }
  }

  try {
    // Only expand if AI engine is ready and query is non-trivial
    if (!aiEngine.isReady || query.length < 3) {
      return { original: query, expanded: [], fromCache: false }
    }

    const prompt = EXPANSION_PROMPT.replace("{query}", query)
    const response = await aiEngine.chat([{ role: "user", content: prompt }])

    // Parse JSON response with fallback
    let parsed: string[]
    try {
      parsed = JSON.parse(response) as string[]
      if (!Array.isArray(parsed)) throw new Error("Not an array")
    } catch {
      // Attempt to extract array from response
      const match = response.match(/\[.*\]/s)
      parsed = match ? (JSON.parse(match[0]) as string[]) : []
    }

    // Sanitize results (max 5, no duplicates, no empty strings)
    const sanitized = [...new Set(parsed.filter(Boolean).slice(0, 5))]

    // Cache result
    expansionCache.set(normalizedQuery, sanitized)

    return { original: query, expanded: sanitized, fromCache: false }
  } catch (error) {
    console.warn("[QueryExpander] Failed to expand query:", error)
    return { original: query, expanded: [], fromCache: false }
  }
}

// Clear cache (useful for testing or memory management)
export function clearExpansionCache() {
  expansionCache.clear()
}

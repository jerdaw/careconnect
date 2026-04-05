const DEFAULT_PREVIEW_COUNT = 2
const DEFAULT_URL_REASON_LIMIT = 5

function normalizeReasonKey(reason: string): string {
  return reason.trim().replace(/\s+/g, " ").toLowerCase()
}

export function normalizeMatchReasons(reasons?: string[] | null): string[] {
  if (!reasons || reasons.length === 0) {
    return []
  }

  const seen = new Set<string>()

  return reasons
    .map((reason) => reason.trim().replace(/\s+/g, " "))
    .filter((reason) => reason.length > 0)
    .filter((reason) => {
      const key = normalizeReasonKey(reason)

      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
}

export function splitMatchReasons(reasons?: string[] | null, previewCount: number = DEFAULT_PREVIEW_COUNT) {
  const normalized = normalizeMatchReasons(reasons)

  return {
    all: normalized,
    preview: normalized.slice(0, previewCount),
    hidden: normalized.slice(previewCount),
  }
}

export function buildMatchReasonSearchParams(
  reasons?: string[] | null,
  limit: number = DEFAULT_URL_REASON_LIMIT
): URLSearchParams {
  const params = new URLSearchParams()

  normalizeMatchReasons(reasons)
    .slice(0, limit)
    .forEach((reason) => params.append("matchReason", reason))

  return params
}

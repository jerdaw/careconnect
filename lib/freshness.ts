export const FRESHNESS_RECENT_WINDOW_DAYS = 30
export const FRESHNESS_STALE_WINDOW_DAYS = 90
export const FRESHNESS_GOVERNANCE_WINDOW_DAYS = 180

export type FreshnessLevel = "fresh" | "recent" | "stale" | "expired" | "unknown"

interface FreshnessSource {
  last_verified?: string | null
  provenance?: {
    verified_at?: string | null
  } | null
}

export function getVerifiedAt(source?: FreshnessSource | string | null): string | undefined {
  if (!source) {
    return undefined
  }

  if (typeof source === "string") {
    return source
  }

  return source.provenance?.verified_at ?? source.last_verified ?? undefined
}

export function getDaysSinceVerified(source?: FreshnessSource | string | null): number | null {
  const verifiedAt = getVerifiedAt(source)

  if (!verifiedAt) {
    return null
  }

  const verifiedDate = new Date(verifiedAt)
  if (Number.isNaN(verifiedDate.getTime())) {
    return null
  }

  const now = new Date()
  return Math.floor((now.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24))
}

export function getFreshnessLevel(source?: FreshnessSource | string | null): FreshnessLevel {
  const daysSinceVerified = getDaysSinceVerified(source)

  if (daysSinceVerified === null) {
    return "unknown"
  }

  if (daysSinceVerified <= FRESHNESS_RECENT_WINDOW_DAYS) {
    return "fresh"
  }

  if (daysSinceVerified <= FRESHNESS_STALE_WINDOW_DAYS) {
    return "recent"
  }

  if (daysSinceVerified <= FRESHNESS_GOVERNANCE_WINDOW_DAYS) {
    return "stale"
  }

  return "expired"
}

export function isBeyondGovernanceFreshnessWindow(source?: FreshnessSource | string | null): boolean {
  return getFreshnessLevel(source) === "expired"
}

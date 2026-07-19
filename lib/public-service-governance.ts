import { FRESHNESS_GOVERNANCE_WINDOW_DAYS, getFreshnessLevel } from "@/lib/freshness"
import type { VerificationLevel } from "@/types/service"

const PUBLIC_VERIFICATION_LEVELS = new Set<string>(["L1", "L2", "L3"])

interface PublicServiceEligibilitySource {
  published?: boolean | null
  deleted_at?: string | null
  verification_level?: VerificationLevel | string | null
  verification_status?: VerificationLevel | string | null
  last_verified?: string | null
  provenance?: {
    verified_at?: string | null
  } | null
}

export function getPublicFreshnessCutoff(now = new Date()): string {
  return new Date(now.getTime() - FRESHNESS_GOVERNANCE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

export function isPublicServiceEligible(service: PublicServiceEligibilitySource): boolean {
  const verificationLevel = service.verification_level ?? service.verification_status
  const freshnessLevel = getFreshnessLevel(service)

  return (
    service.published !== false &&
    !service.deleted_at &&
    typeof verificationLevel === "string" &&
    PUBLIC_VERIFICATION_LEVELS.has(verificationLevel) &&
    freshnessLevel !== "expired" &&
    freshnessLevel !== "unknown"
  )
}

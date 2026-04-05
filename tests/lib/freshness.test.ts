import { describe, expect, it } from "vitest"

import {
  FRESHNESS_GOVERNANCE_WINDOW_DAYS,
  getFreshnessLevel,
  getVerifiedAt,
  isBeyondGovernanceFreshnessWindow,
} from "@/lib/freshness"

describe("freshness policy helpers", () => {
  it("prefers provenance verification timestamps when available", () => {
    expect(
      getVerifiedAt({
        last_verified: "2026-01-01T00:00:00.000Z",
        provenance: { verified_at: "2026-02-01T00:00:00.000Z" },
      })
    ).toBe("2026-02-01T00:00:00.000Z")
  })

  it("marks records beyond the governance window as expired", () => {
    const expired = new Date()
    expired.setDate(expired.getDate() - (FRESHNESS_GOVERNANCE_WINDOW_DAYS + 10))

    expect(getFreshnessLevel(expired.toISOString())).toBe("expired")
    expect(isBeyondGovernanceFreshnessWindow(expired.toISOString())).toBe(true)
  })
})

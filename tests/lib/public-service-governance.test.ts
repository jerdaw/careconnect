import { describe, expect, it } from "vitest"
import { getPublicFreshnessCutoff, isPublicServiceEligible } from "@/lib/public-service-governance"

describe("public service governance", () => {
  it("computes the 180-day public freshness cutoff", () => {
    expect(getPublicFreshnessCutoff(new Date("2026-07-18T12:00:00.000Z"))).toBe("2026-01-19T12:00:00.000Z")
  })

  it("allows only current, published, non-deleted L1-L3 services", () => {
    const current = {
      published: true,
      verification_level: "L2",
      last_verified: new Date().toISOString(),
    }

    expect(isPublicServiceEligible(current)).toBe(true)
    expect(isPublicServiceEligible({ ...current, published: false })).toBe(false)
    expect(isPublicServiceEligible({ ...current, deleted_at: new Date().toISOString() })).toBe(false)
    expect(isPublicServiceEligible({ ...current, verification_level: "L0" })).toBe(false)
    expect(isPublicServiceEligible({ ...current, last_verified: "2000-01-01T00:00:00.000Z" })).toBe(false)
    expect(isPublicServiceEligible({ published: true, verification_level: "L2" })).toBe(false)
  })

  it("accepts a current provenance verification date when last_verified is absent", () => {
    expect(
      isPublicServiceEligible({
        published: true,
        verification_status: "L1",
        provenance: { verified_at: new Date().toISOString() },
      })
    ).toBe(true)
  })
})

import { describe, expect, it } from "vitest"
import {
  getCoverageBadges,
  getPrimaryPlaceLabel,
  normalizeServiceCoverage,
  serviceServesPlace,
} from "@/lib/places/coverage"
import { IntentCategory, VerificationLevel, type Service } from "@/types/service"

const baseService: Service = {
  id: "svc",
  name: "Service",
  description: "A public service record",
  url: "https://example.com",
  verification_level: VerificationLevel.L1,
  intent_category: IntentCategory.Community,
  provenance: {
    verified_by: "jer",
    verified_at: "2026-07-06T00:00:00.000Z",
    evidence_url: "https://example.com",
    method: "manual_review",
  },
  identity_tags: [],
  synthetic_queries: [],
}

describe("coverage helpers", () => {
  it("maps legacy Kingston scope to Kingston local coverage", () => {
    const service = { ...baseService, scope: "kingston" as const }

    expect(normalizeServiceCoverage(service)).toEqual([{ kind: "local", placeIds: ["kingston-on"] }])
    expect(serviceServesPlace(service, "kingston-on")).toBe(true)
    expect(serviceServesPlace(service, "brampton-on")).toBe(false)
  })

  it("maps legacy provincial and national scopes to broad coverage", () => {
    expect(serviceServesPlace({ ...baseService, scope: "ontario" }, "brampton-on")).toBe(true)
    expect(serviceServesPlace({ ...baseService, scope: "canada" }, "kingston-on")).toBe(true)
  })

  it("uses explicit coverage before legacy scope", () => {
    const service: Service = {
      ...baseService,
      scope: "kingston",
      coverage: [{ kind: "local", placeIds: ["brampton-on"] }],
    }

    expect(serviceServesPlace(service, "brampton-on")).toBe(true)
    expect(serviceServesPlace(service, "kingston-on")).toBe(false)
  })

  it("returns human-readable coverage badges", () => {
    const service: Service = {
      ...baseService,
      coverage: [
        { kind: "local", placeIds: ["brampton-on"] },
        { kind: "provincial", label: "Ontario-wide" },
      ],
    }

    expect(getCoverageBadges(service).map((badge) => badge.label)).toEqual(["Brampton", "Ontario-wide"])
  })

  it("returns a primary place label when available", () => {
    expect(getPrimaryPlaceLabel({ ...baseService, primary_place_id: "brampton-on" })).toBe("Brampton")
  })
})

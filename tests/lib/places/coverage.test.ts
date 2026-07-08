import { describe, expect, it } from "vitest"
import {
  getCoverageBadges,
  getPrimaryPlaceLabel,
  normalizeServiceCoverage,
  serviceServesPlace,
  hasPlaceSpecificCoverage,
  isBroadCoverageOnly,
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

  it("allows regional coverage to explicitly serve a supported place", () => {
    const service: Service = {
      ...baseService,
      coverage: [{ kind: "regional", placeIds: ["brampton-on"], label: "Peel Region" }],
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

  it("classifies broad-only coverage for compatibility filters", () => {
    expect(isBroadCoverageOnly({ ...baseService, coverage: [{ kind: "provincial", label: "Ontario-wide" }] })).toBe(
      true
    )
    expect(isBroadCoverageOnly({ ...baseService, coverage: [{ kind: "local", placeIds: ["brampton-on"] }] })).toBe(
      false
    )
    expect(
      isBroadCoverageOnly({
        ...baseService,
        coverage: [
          { kind: "local", placeIds: ["brampton-on"] },
          { kind: "provincial", label: "Ontario-wide" },
        ],
      })
    ).toBe(false)
  })

  it("detects place-specific local or regional coverage", () => {
    expect(
      hasPlaceSpecificCoverage(
        { ...baseService, coverage: [{ kind: "local", placeIds: ["brampton-on"] }] },
        "brampton-on"
      )
    ).toBe(true)
    expect(
      hasPlaceSpecificCoverage(
        { ...baseService, coverage: [{ kind: "regional", placeIds: ["brampton-on"], label: "Peel Region" }] },
        "brampton-on"
      )
    ).toBe(true)
    expect(
      hasPlaceSpecificCoverage(
        { ...baseService, coverage: [{ kind: "provincial", label: "Ontario-wide" }] },
        "brampton-on"
      )
    ).toBe(false)
  })

  it("keeps Brampton local and regional draft-shaped records out of Kingston results", () => {
    const bramptonLocal: Service = {
      ...baseService,
      id: "brampton-local",
      primary_place_id: "brampton-on",
      coverage: [{ kind: "local", placeIds: ["brampton-on"], label: "Brampton" }],
    }
    const bramptonRegional: Service = {
      ...baseService,
      id: "brampton-regional",
      primary_place_id: "brampton-on",
      coverage: [
        {
          kind: "regional",
          placeIds: ["brampton-on"],
          regionIds: ["peel-region"],
          label: "Peel Region",
        },
      ],
    }

    expect(serviceServesPlace(bramptonLocal, "brampton-on")).toBe(true)
    expect(serviceServesPlace(bramptonLocal, "kingston-on")).toBe(false)
    expect(serviceServesPlace(bramptonRegional, "brampton-on")).toBe(true)
    expect(serviceServesPlace(bramptonRegional, "kingston-on")).toBe(false)
  })
})

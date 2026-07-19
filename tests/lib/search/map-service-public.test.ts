import { describe, expect, it } from "vitest"
import { mapServicePublicToService } from "@/lib/search/map-service-public"
import { IntentCategory, VerificationLevel } from "@/types/service"
import type { ServicePublic } from "@/types/service-public"

describe("mapServicePublicToService", () => {
  const baseService: ServicePublic = {
    id: "svc-1",
    name: "Food Access",
    name_fr: null,
    description: "Fresh food support",
    description_fr: null,
    address: "123 Main St",
    address_fr: null,
    phone: "555-0101",
    url: "https://example.com",
    email: "help@example.com",
    hours: {
      monday: { open: "09:00", close: "17:00" },
    },
    fees: null,
    eligibility: "Open to residents",
    eligibility_notes: "Bring ID",
    eligibility_notes_fr: null,
    application_process: "Call first",
    languages: ["en", "fr"],
    bus_routes: ["1"],
    accessibility: { wheelchair: true },
    last_verified: "2026-03-01T00:00:00.000Z",
    verification_status: VerificationLevel.L2,
    category: IntentCategory.Food,
    tags: [{ tag: "Youth", evidence_url: "https://example.com/youth" }, "Women"],
    scope: "kingston",
    virtual_delivery: false,
    primary_phone_label: "Main line",
    created_at: "2026-01-01T00:00:00.000Z",
    synthetic_queries: ["food bank"],
    synthetic_queries_fr: ["banque alimentaire"],
    authority_tier: "community",
    resource_indicators: { staff_size: "medium" },
    coordinates: { lat: 44.2312, lng: -76.486 },
    embedding: [0.1, 0.2, 0.3],
    provenance: {
      verified_by: "casey",
      verified_at: "2026-03-01T00:00:00.000Z",
      evidence_url: "https://example.com/evidence",
      method: "manual_review",
    },
  }

  it("maps typed JSON and enum fields into the app service shape", () => {
    const mapped = mapServicePublicToService(baseService)

    expect(mapped.hours).toEqual(baseService.hours)
    expect(mapped.accessibility).toEqual(baseService.accessibility)
    expect(mapped.coordinates).toEqual(baseService.coordinates)
    expect(mapped.embedding).toEqual(baseService.embedding)
    expect(mapped.intent_category).toBe(IntentCategory.Food)
    expect(mapped.verification_level).toBe(VerificationLevel.L2)
    expect(mapped.identity_tags).toEqual([
      { tag: "Youth", evidence_url: "https://example.com/youth" },
      { tag: "Women", evidence_url: "" },
    ])
    expect(mapped.provenance).toEqual(baseService.provenance)
  })

  it("normalizes serialized embeddings and rejects malformed values", () => {
    const serialized = mapServicePublicToService({
      ...baseService,
      embedding: "[0.1,0.2,0.3]",
    })
    const malformed = mapServicePublicToService({
      ...baseService,
      embedding: '[0.1,"bad"]',
    })

    expect(serialized.embedding).toEqual([0.1, 0.2, 0.3])
    expect(malformed.embedding).toBeUndefined()
  })

  it("replaces UUID-shaped public provenance verifier IDs with a public label", () => {
    const mapped = mapServicePublicToService({
      ...baseService,
      provenance: {
        ...baseService.provenance!,
        verified_by: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      },
    })

    expect(mapped.provenance?.verified_by).toBe("CareConnect Admin")
  })

  it("keeps non-UUID public provenance verifier labels", () => {
    const mapped = mapServicePublicToService({
      ...baseService,
      provenance: {
        ...baseService.provenance!,
        verified_by: "Community Partner",
      },
    })

    expect(mapped.provenance?.verified_by).toBe("Community Partner")
  })

  it("maps public coverage and primary place fields", () => {
    const mapped = mapServicePublicToService({
      ...baseService,
      primary_place_id: "brampton-on",
      coverage: [{ kind: "local", placeIds: ["brampton-on"] }],
    } as ServicePublic)

    expect(mapped.primary_place_id).toBe("brampton-on")
    expect(mapped.coverage).toEqual([{ kind: "local", placeIds: ["brampton-on"] }])
  })

  it("falls back safely when category, verification, tags, or provenance are absent", () => {
    const mapped = mapServicePublicToService({
      ...baseService,
      category: null,
      verification_status: null,
      tags: null,
      provenance: null,
    })

    expect(mapped.intent_category).toBe(IntentCategory.Community)
    expect(mapped.verification_level).toBe(VerificationLevel.L1)
    expect(mapped.identity_tags).toEqual([])
    expect(mapped.provenance).toEqual({
      verified_by: "",
      verified_at: "",
      evidence_url: "",
      method: "",
    })
  })
})

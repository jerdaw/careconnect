import { describe, expect, it } from "vitest"
import { buildCuratedRuntimeBackfillUpdate } from "@/lib/service-db-backfill"
import type { ServiceRow } from "@/lib/service-db"
import { IntentCategory, VerificationLevel, type Service } from "@/types/service"

function createCuratedService(overrides: Partial<Service> = {}): Partial<Service> & Pick<Service, "id" | "name"> {
  return {
    id: "service-1",
    name: "Curated Service",
    description: "Verified description",
    intent_category: IntentCategory.Community,
    verification_level: VerificationLevel.L2,
    identity_tags: [],
    synthetic_queries: ["help with depression"],
    synthetic_queries_fr: ["aide pour la depression"],
    provenance: {
      verified_by: "Curator",
      verified_at: "2026-04-18T00:00:00.000Z",
      evidence_url: "https://careconnect.ing/evidence/service-1",
      method: "manual_review",
    },
    access_script: "Call 613-555-0100 and ask about intake.",
    access_script_fr: "Appelez au 613-555-0100 et demandez l'admission.",
    ...overrides,
  }
}

describe("buildCuratedRuntimeBackfillUpdate", () => {
  it("fills missing DB-authoritative runtime fields from the curated snapshot", () => {
    const currentRow = {
      id: "service-1",
      name: "Curated Service",
      synthetic_queries: null,
      synthetic_queries_fr: null,
      provenance: null,
      access_script: null,
      access_script_fr: null,
    } as Partial<ServiceRow>

    const update = buildCuratedRuntimeBackfillUpdate(currentRow, createCuratedService())

    expect(update.synthetic_queries).toEqual(["help with depression"])
    expect(update.synthetic_queries_fr).toEqual(["aide pour la depression"])
    expect(update.access_script).toBe("Call 613-555-0100 and ask about intake.")
    expect(update.access_script_fr).toBe("Appelez au 613-555-0100 et demandez l'admission.")
    expect(update.provenance).toEqual({
      verified_by: "Curator",
      verified_at: "2026-04-18T00:00:00.000Z",
      evidence_url: "https://careconnect.ing/evidence/service-1",
      method: "manual_review",
    })
  })

  it("does not overwrite non-empty DB values", () => {
    const currentRow = {
      id: "service-1",
      name: "Curated Service",
      synthetic_queries: ["existing intent"],
      access_script: "Existing script",
      access_script_fr: "Script existant",
    } as Partial<ServiceRow>

    const update = buildCuratedRuntimeBackfillUpdate(currentRow, createCuratedService())

    expect(update.synthetic_queries).toBeUndefined()
    expect(update.access_script).toBeUndefined()
    expect(update.access_script_fr).toBeUndefined()
  })

  it("treats blank strings and empty arrays as backfillable gaps", () => {
    const currentRow = {
      id: "service-1",
      name: "Curated Service",
      synthetic_queries: [],
      access_script: "   ",
      access_script_fr: "",
      provenance: {
        verified_by: "",
        verified_at: "",
        evidence_url: "",
        method: "",
      },
    } as Partial<ServiceRow>

    const update = buildCuratedRuntimeBackfillUpdate(currentRow, createCuratedService())

    expect(update.synthetic_queries).toEqual(["help with depression"])
    expect(update.access_script).toBe("Call 613-555-0100 and ask about intake.")
    expect(update.access_script_fr).toBe("Appelez au 613-555-0100 et demandez l'admission.")
    expect(update.provenance).toEqual({
      verified_by: "Curator",
      verified_at: "2026-04-18T00:00:00.000Z",
      evidence_url: "https://careconnect.ing/evidence/service-1",
      method: "manual_review",
    })
  })
})

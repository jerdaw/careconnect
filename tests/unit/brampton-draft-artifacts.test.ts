import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import services from "@/data/services.json"
import { ServiceSchema } from "@/lib/schemas/service"

type DraftService = {
  id: string
  primary_place_id?: string
  coverage?: Array<{
    kind: string
    placeIds?: string[]
    regionIds?: string[]
    label?: string
  }>
  provenance?: {
    method?: string
  }
}

const draftDir = path.join(process.cwd(), "data/drafts/brampton-on/services")
const expectedDraftFiles = [
  "brampton-peel-centralized-shelter-intake.json",
  "brampton-wilkinson-road-shelter.json",
  "brampton-victim-services-of-peel.json",
  "brampton-safe-centre-of-peel.json",
  "brampton-peel-ontario-works-emergency-assistance.json",
  "brampton-regeneration-marketplace-food-bank.json",
  "brampton-knights-table-food-bank-meals.json",
  "brampton-ste-louise-food-bank.json",
]

const pendingDraftFiles: string[] = []

describe("Brampton draft service artifacts", () => {
  it("keeps promoted Brampton service records traceable to coverage-explicit draft artifacts", () => {
    const liveServiceIds = new Set(services.map((service) => service.id))

    for (const fileName of expectedDraftFiles) {
      const filePath = path.join(draftDir, fileName)
      const draft = JSON.parse(fs.readFileSync(filePath, "utf8")) as DraftService

      expect(draft.id).toBe(fileName.replace(/\.json$/, ""))
      expect(liveServiceIds.has(draft.id)).toBe(true)
      expect(draft.primary_place_id).toBe("brampton-on")
      expect(draft.coverage?.length).toBeGreaterThan(0)
      expect(draft.coverage?.some((area) => area.placeIds?.includes("brampton-on"))).toBe(true)
      expect(draft.coverage?.some((area) => area.placeIds?.includes("kingston-on"))).toBe(false)
      expect(draft.provenance?.method).toBe("public_source_review")
      expect(ServiceSchema.safeParse(draft).success).toBe(true)
    }
  })

  it("keeps pending Brampton draft records out of live data until approval", () => {
    const liveServiceIds = new Set(services.map((service) => service.id))

    for (const fileName of pendingDraftFiles) {
      const filePath = path.join(draftDir, fileName)
      const draft = JSON.parse(fs.readFileSync(filePath, "utf8")) as DraftService

      expect(draft.id).toBe(fileName.replace(/\.json$/, ""))
      expect(liveServiceIds.has(draft.id)).toBe(false)
      expect(draft.primary_place_id).toBe("brampton-on")
      expect(draft.coverage?.length).toBeGreaterThan(0)
      expect(draft.coverage?.some((area) => area.placeIds?.includes("brampton-on"))).toBe(true)
      expect(draft.coverage?.some((area) => area.placeIds?.includes("kingston-on"))).toBe(false)
      expect(draft.provenance?.method).toBe("public_source_review")
      expect(ServiceSchema.safeParse(draft).success).toBe(true)
    }
  })
})

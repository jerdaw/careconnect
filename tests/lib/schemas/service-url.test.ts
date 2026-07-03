import { describe, expect, it } from "vitest"
import { PartnerServiceEditSchema } from "@/lib/schemas/service-partner-edit"
import { CSVImportRowSchema } from "@/lib/schemas/service-csv-import"
import { ServiceCreateSchema } from "@/lib/schemas/service-create"
import { ServiceSchema } from "@/lib/schemas/service"

const baseServiceCreate = {
  name: "Test Service",
  description: "A sufficiently long service description.",
  intent_category: "Health",
}

const baseService = {
  id: "service-1",
  name: "Test Service",
  description: "A sufficiently long service description.",
  verification_level: "L1",
  intent_category: "Health",
  provenance: {
    verified_by: "Runtime Verifier",
    verified_at: "2026-03-08T00:00:00.000Z",
    evidence_url: "https://example.com/evidence",
    method: "test",
  },
  identity_tags: [],
  synthetic_queries: [],
}

describe("service URL schemas", () => {
  it.each(["javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "mailto:test@example.com"])(
    "rejects non-http service URL %s",
    (url) => {
      expect(ServiceCreateSchema.safeParse({ ...baseServiceCreate, url }).success).toBe(false)
      expect(PartnerServiceEditSchema.safeParse({ url }).success).toBe(false)
      expect(ServiceSchema.safeParse({ ...baseService, url }).success).toBe(false)
      expect(CSVImportRowSchema.safeParse({ ...baseServiceCreate, url }).success).toBe(false)
    }
  )

  it.each(["https://example.com", "http://example.com"])("accepts %s service URLs", (url) => {
    expect(ServiceCreateSchema.safeParse({ ...baseServiceCreate, url }).success).toBe(true)
    expect(PartnerServiceEditSchema.safeParse({ url }).success).toBe(true)
    expect(ServiceSchema.safeParse({ ...baseService, url }).success).toBe(true)
    expect(CSVImportRowSchema.safeParse({ ...baseServiceCreate, url }).success).toBe(true)
  })

  it.each(["javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "mailto:test@example.com"])(
    "rejects non-http public evidence URL %s",
    (evidenceUrl) => {
      expect(
        ServiceSchema.safeParse({
          ...baseService,
          phone: "613-555-0100",
          provenance: {
            ...baseService.provenance,
            evidence_url: evidenceUrl,
          },
        }).success
      ).toBe(false)
      expect(
        ServiceSchema.safeParse({
          ...baseService,
          phone: "613-555-0100",
          identity_tags: [{ tag: "Youth", evidence_url: evidenceUrl }],
        }).success
      ).toBe(false)
    }
  )
})

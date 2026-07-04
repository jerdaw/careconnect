/** @vitest-environment node */
import { describe, expect, it } from "vitest"

import {
  buildStalenessReport,
  renderStalenessCsv,
  renderStalenessMarkdown,
  type StalenessReport,
} from "@/scripts/check-staleness"
import { IntentCategory, VerificationLevel, type Service } from "@/types/service"

type ServiceFixtureOverrides = Omit<
  Partial<Service>,
  "id" | "name" | "intent_category" | "provenance" | "verification_level"
> & {
  id: string
  name?: string
  intent_category?: IntentCategory
  provenance?: Service["provenance"] | null
  verification_level?: VerificationLevel
}

function provenance(verifiedAt: string): Service["provenance"] {
  return {
    verified_by: "tester",
    verified_at: verifiedAt,
    evidence_url: "https://example.test/source",
    method: "web",
  }
}

function service(overrides: ServiceFixtureOverrides): Service {
  const {
    id,
    name,
    intent_category = IntentCategory.Food,
    provenance: provenanceOverride,
    verification_level = VerificationLevel.L1,
    ...rest
  } = overrides

  const base = {
    id,
    name: name ?? id,
    description: "Fixture service",
    url: "https://example.test",
    verification_level,
    intent_category,
    provenance: provenance("2026-06-01T00:00:00.000Z"),
    identity_tags: [],
    synthetic_queries: [],
    ...rest,
  } satisfies Service

  return {
    ...base,
    provenance: provenanceOverride === null ? undefined : (provenanceOverride ?? base.provenance),
  } as unknown as Service
}

describe("check-staleness report exports", () => {
  it("builds a deterministic full-directory freshness report without mutating services", () => {
    const report = buildStalenessReport(
      [
        service({
          id: "crisis-fresh",
          intent_category: IntentCategory.Crisis,
          provenance: provenance("2026-06-20T00:00:00.000Z"),
        }),
        service({
          id: "crisis-due",
          intent_category: IntentCategory.Crisis,
          provenance: provenance("2026-05-01T00:00:00.000Z"),
        }),
        service({
          id: "food-stale",
          provenance: provenance("2026-01-01T00:00:00.000Z"),
        }),
        service({
          id: "unknown-date",
          provenance: null,
          last_verified: undefined,
        }),
      ],
      { asOf: new Date("2026-07-04T00:00:00.000Z"), generatedAt: "2026-07-04T12:00:00.000Z" }
    )

    expect(report.summary).toMatchObject({
      total: 4,
      fresh: 1,
      due: 1,
      stale: 1,
      unknown: 1,
      visible_within_180_day_window: 2,
      hidden_pending_reverification: 2,
    })
    expect(report.generated_at).toBe("2026-07-04T12:00:00.000Z")
    expect(report.as_of).toBe("2026-07-04")
    expect(row(report, "crisis-due")).toMatchObject({
      cadence_days: 30,
      days_since_verification: 64,
      priority_lane: "2 - crisis due",
      search_visibility: "visible_due_for_reverification",
      status: "due",
    })
    expect(row(report, "food-stale")).toMatchObject({
      cadence_days: 90,
      days_since_verification: 184,
      priority_lane: "3 - stale",
      search_visibility: "hidden_pending_reverification",
      status: "stale",
    })
    expect(row(report, "unknown-date")).toMatchObject({
      days_since_verification: null,
      priority_lane: "4 - unknown verification date",
      search_visibility: "hidden_pending_reverification",
      status: "unknown",
    })
  })

  it("renders governance-safe markdown and worksheet exports", () => {
    const report = buildStalenessReport(
      [
        service({
          id: "formula-name",
          name: '=HYPERLINK("https://example.test")',
          provenance: provenance("2026-01-01T00:00:00.000Z"),
        }),
      ],
      { asOf: new Date("2026-07-04T00:00:00.000Z"), generatedAt: "2026-07-04T12:00:00.000Z" }
    )

    const markdown = renderStalenessMarkdown(report)
    const csv = renderStalenessCsv(report)

    expect(markdown).toContain("# Service Freshness Audit")
    expect(markdown).toContain("No service facts, verification dates, or provenance were updated by this audit.")
    expect(markdown).toContain("Hidden pending reverification: 1")
    expect(csv.split("\n")[0]).toContain("service_id,name,category")
    expect(csv).toContain("\"'" + '=HYPERLINK(""https://example.test"")"')
    expect(csv).not.toContain("formula-name,=HYPERLINK")
  })
})

function row(report: StalenessReport, serviceId: string) {
  const match = report.services.find((service) => service.service_id === serviceId)
  expect(match).toBeDefined()
  return match
}

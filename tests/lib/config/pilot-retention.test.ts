import { describe, expect, it } from "vitest"
import {
  getPilotIntegrationRetentionCoverageSummary,
  getPilotIntegrationRetentionRule,
  PILOT_INTEGRATION_RETENTION_POLICY,
} from "@/lib/config/pilot-retention"
import { PILOT_INTEGRATION_RETENTION_FIELDS } from "@/types/pilot-retention"

describe("pilot retention policy", () => {
  it("tracks every allowed integration feasibility field exactly once", () => {
    const fields = PILOT_INTEGRATION_RETENTION_POLICY.rules.map((rule) => rule.field)

    expect(new Set(fields).size).toBe(fields.length)
    expect(fields.sort()).toEqual([...PILOT_INTEGRATION_RETENTION_FIELDS].sort())
  })

  it("keeps the proposed policy in draft mode until human sign-off", () => {
    expect(PILOT_INTEGRATION_RETENTION_POLICY.status).toBe("PROPOSED")
    expect(PILOT_INTEGRATION_RETENTION_POLICY.version).toBe("2026-03-24-draft-1")
  })

  it("assigns bounded retention windows and deletion triggers to every field", () => {
    for (const field of PILOT_INTEGRATION_RETENTION_FIELDS) {
      const rule = getPilotIntegrationRetentionRule(field)

      expect(rule.retentionWindowDays).toBe(365)
      expect(rule.deletionTriggers).toContain("time_based")
      expect(rule.deletionTriggers).toContain("decision_superseded")
      expect(rule.deletionExecutor).toBe("manual_governance_runbook")
    }
  })

  it("reports full policy coverage with no missing fields", () => {
    expect(getPilotIntegrationRetentionCoverageSummary()).toEqual({
      status: "PROPOSED",
      version: "2026-03-24-draft-1",
      coveredFieldCount: 6,
      totalFieldCount: 6,
      missingFields: [],
      maxRetentionWindowDays: 365,
    })
  })
})

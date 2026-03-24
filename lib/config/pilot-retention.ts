import {
  PILOT_INTEGRATION_RETENTION_FIELDS,
  PilotIntegrationRetentionField,
  PilotIntegrationRetentionPolicy,
  PilotIntegrationRetentionRule,
} from "@/types/pilot-retention"

export const PILOT_INTEGRATION_RETENTION_POLICY: PilotIntegrationRetentionPolicy = {
  status: "PROPOSED",
  version: "2026-03-24-draft-1",
  lastReviewed: "2026-03-24",
  rules: [
    {
      field: "decision",
      dataClass: "governance decision enum",
      requiredForFunction: true,
      retentionWindowDays: 365,
      deletionTriggers: ["time_based", "decision_superseded"],
      deletionExecutor: "manual_governance_runbook",
      storageLocation: "pilot_integration_feasibility_decisions",
      verificationEvidence: "dry-run candidate query + before/after deletion audit record",
      notes: "Retain for one pilot cycle plus audit follow-up; do not keep indefinitely.",
    },
    {
      field: "decision_date",
      dataClass: "governance metadata",
      requiredForFunction: true,
      retentionWindowDays: 365,
      deletionTriggers: ["time_based", "decision_superseded"],
      deletionExecutor: "manual_governance_runbook",
      storageLocation: "pilot_integration_feasibility_decisions",
      verificationEvidence: "dry-run candidate query + before/after deletion audit record",
      notes: "Required for dated audit traceability during the pilot review window.",
    },
    {
      field: "redline_checklist_version",
      dataClass: "governance metadata",
      requiredForFunction: true,
      retentionWindowDays: 365,
      deletionTriggers: ["time_based", "decision_superseded"],
      deletionExecutor: "manual_governance_runbook",
      storageLocation: "pilot_integration_feasibility_decisions",
      verificationEvidence: "dry-run candidate query + before/after deletion audit record",
      notes: "Retain only long enough to reconstruct which control set governed a decision.",
    },
    {
      field: "violations",
      dataClass: "policy outcome codes",
      requiredForFunction: true,
      retentionWindowDays: 365,
      deletionTriggers: ["time_based", "decision_superseded"],
      deletionExecutor: "manual_governance_runbook",
      storageLocation: "pilot_integration_feasibility_decisions",
      verificationEvidence: "dry-run candidate query + before/after deletion audit record",
      notes: "Code-only values are retained for auditability, not long-term analytics.",
    },
    {
      field: "compensating_controls",
      dataClass: "governance remediation notes",
      requiredForFunction: false,
      retentionWindowDays: 365,
      deletionTriggers: ["time_based", "decision_superseded"],
      deletionExecutor: "manual_governance_runbook",
      storageLocation: "pilot_integration_feasibility_decisions",
      verificationEvidence: "dry-run candidate query + before/after deletion audit record",
      notes: "Conditional-only field; same retention cap applies to avoid stale governance text.",
    },
    {
      field: "owners",
      dataClass: "internal ownership labels",
      requiredForFunction: true,
      retentionWindowDays: 365,
      deletionTriggers: ["time_based", "decision_superseded"],
      deletionExecutor: "manual_governance_runbook",
      storageLocation: "pilot_integration_feasibility_decisions",
      verificationEvidence: "dry-run candidate query + before/after deletion audit record",
      notes: "Owner labels are internal-only and should age out with the underlying decision record.",
    },
  ],
}

export function getPilotIntegrationRetentionRule(field: PilotIntegrationRetentionField): PilotIntegrationRetentionRule {
  const rule = PILOT_INTEGRATION_RETENTION_POLICY.rules.find((candidate) => candidate.field === field)
  if (!rule) {
    throw new Error(`Missing retention policy rule for field: ${field}`)
  }

  return rule
}

export function getPilotIntegrationRetentionCoverageSummary() {
  const coveredFields = new Set(PILOT_INTEGRATION_RETENTION_POLICY.rules.map((rule) => rule.field))
  const missingFields = PILOT_INTEGRATION_RETENTION_FIELDS.filter((field) => !coveredFields.has(field))

  return {
    status: PILOT_INTEGRATION_RETENTION_POLICY.status,
    version: PILOT_INTEGRATION_RETENTION_POLICY.version,
    coveredFieldCount: coveredFields.size,
    totalFieldCount: PILOT_INTEGRATION_RETENTION_FIELDS.length,
    missingFields,
    maxRetentionWindowDays: Math.max(
      ...PILOT_INTEGRATION_RETENTION_POLICY.rules.map((rule) => rule.retentionWindowDays)
    ),
  }
}

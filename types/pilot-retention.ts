export const PILOT_INTEGRATION_RETENTION_FIELDS = [
  "decision",
  "decision_date",
  "redline_checklist_version",
  "violations",
  "compensating_controls",
  "owners",
] as const

export type PilotIntegrationRetentionField = (typeof PILOT_INTEGRATION_RETENTION_FIELDS)[number]

export const RETENTION_POLICY_STATUSES = ["PROPOSED", "APPROVED"] as const
export type RetentionPolicyStatus = (typeof RETENTION_POLICY_STATUSES)[number]

export const RETENTION_TRIGGER_TYPES = ["time_based", "decision_superseded"] as const
export type RetentionTriggerType = (typeof RETENTION_TRIGGER_TYPES)[number]

export const RETENTION_EXECUTOR_TYPES = ["manual_governance_runbook"] as const
export type RetentionExecutorType = (typeof RETENTION_EXECUTOR_TYPES)[number]

export interface PilotIntegrationRetentionRule {
  field: PilotIntegrationRetentionField
  dataClass: string
  requiredForFunction: boolean
  retentionWindowDays: number
  deletionTriggers: readonly RetentionTriggerType[]
  deletionExecutor: RetentionExecutorType
  storageLocation: "pilot_integration_feasibility_decisions"
  verificationEvidence: string
  notes: string
}

export interface PilotIntegrationRetentionPolicy {
  status: RetentionPolicyStatus
  version: string
  lastReviewed: string
  rules: readonly PilotIntegrationRetentionRule[]
}

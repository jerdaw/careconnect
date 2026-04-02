export const ATTEMPT_CHANNELS = ["phone", "website", "email", "in_person", "referral"] as const
export type AttemptChannel = (typeof ATTEMPT_CHANNELS)[number]

export const ATTEMPT_OUTCOMES = [
  "connected",
  "disconnected_number",
  "no_response",
  "intake_unavailable",
  "invalid_routing",
  "other_failure",
] as const
export type AttemptOutcome = (typeof ATTEMPT_OUTCOMES)[number]

export const OUTCOME_NOTES_CODES = [
  "busy_signal",
  "voicemail_only",
  "eligibility_mismatch",
  "hours_mismatch",
  "capacity_full",
  "unknown_failure",
] as const
export type OutcomeNotesCode = (typeof OUTCOME_NOTES_CODES)[number]

export interface PilotContactAttemptEvent {
  id: string
  pilot_cycle_id: string
  service_id: string
  recorded_by_org_id: string
  entity_key_hash: string
  attempt_channel: AttemptChannel
  attempt_outcome: AttemptOutcome
  attempted_at: string
  resolved_at?: string | null
  outcome_notes_code?: OutcomeNotesCode | null
}

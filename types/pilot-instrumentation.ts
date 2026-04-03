export const PILOT_SCOPE_SLA_TIERS = ["crisis", "high_demand", "standard"] as const
export type PilotScopeSlaTier = (typeof PILOT_SCOPE_SLA_TIERS)[number]

export const SERVICE_OPERATIONAL_STATUS_CODES = ["available", "temporarily_unavailable", "closed", "unknown"] as const
export type ServiceOperationalStatusCode = (typeof SERVICE_OPERATIONAL_STATUS_CODES)[number]

export const PILOT_DATA_DECAY_FATAL_ERROR_CATEGORIES = [
  "wrong_or_disconnected_phone",
  "invalid_or_defunct_intake_path",
  "materially_incorrect_eligibility",
  "service_closed_or_unavailable_but_listed_available",
] as const
export type PilotDataDecayFatalErrorCategory = (typeof PILOT_DATA_DECAY_FATAL_ERROR_CATEGORIES)[number]

export const PILOT_DATA_DECAY_VERIFICATION_MODES = ["web_only", "web_plus_call", "provider_confirmation"] as const
export type PilotDataDecayVerificationMode = (typeof PILOT_DATA_DECAY_VERIFICATION_MODES)[number]

export interface PilotConnectionEvent {
  id: string
  pilot_cycle_id: string
  org_id: string
  service_id: string
  connected_at: string
  contact_attempt_event_id?: string | null
  referral_event_id?: string | null
}

export interface PilotServiceScopeRecord {
  id: string
  pilot_cycle_id: string
  org_id: string
  service_id: string
  sla_tier: PilotScopeSlaTier
}

export interface ServiceOperationalStatusEvent {
  id: string
  pilot_cycle_id: string
  org_id: string
  service_id: string
  checked_at: string
  status_code: ServiceOperationalStatusCode
}

export interface PilotDataDecayAudit {
  id: string
  pilot_cycle_id: string
  org_id: string
  service_id: string
  audited_at: string
  is_fatal: boolean
  fatal_error_category?: PilotDataDecayFatalErrorCategory | null
  verification_mode: PilotDataDecayVerificationMode
}

export interface PilotPreferenceFitEvent {
  id: string
  pilot_cycle_id: string
  org_id: string
  cohort_label: string
  recorded_at: string
  preferred_via_careconnect: boolean
}

export const PILOT_METRIC_IDS = ["M1", "M2_P50", "M2_P75", "M2_P90", "M3", "M4", "M5", "M6", "M7"] as const
export type PilotMetricId = (typeof PILOT_METRIC_IDS)[number]

export interface PilotMetricSnapshot {
  pilot_cycle_id: string
  metric_id: PilotMetricId
  metric_value: number | null
  numerator: number | null
  denominator: number | null
  calculated_at: string
}

export interface PilotScorecard {
  pilot_cycle_id: string
  generated_at: string
  m1_failed_contact_rate: number | null
  m2_p50_seconds_to_connection: number | null
  m2_p75_seconds_to_connection: number | null
  m2_p90_seconds_to_connection: number | null
  m3_referral_completion_capture_rate: number | null
  m4_freshness_sla_compliance: number | null
  m5_repeat_failure_rate: number | null
  m6_data_decay_fatal_error_rate: number | null
  m7_preference_fit_indicator: number | null
}

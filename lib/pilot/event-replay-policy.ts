import { createHash } from "crypto"
import type { PilotContactAttemptEvent } from "@/types/pilot-contact-attempt"
import type { PilotReferralEvent } from "@/types/pilot-referral"
import type {
  PilotConnectionEvent,
  PilotDataDecayAudit,
  PilotPreferenceFitEvent,
  ServiceOperationalStatusEvent,
} from "@/types/pilot-instrumentation"

export type PilotReplayPayloads = {
  connection: Omit<PilotConnectionEvent, "id">
  contact_attempt: Omit<PilotContactAttemptEvent, "id">
  data_decay_audit: Omit<PilotDataDecayAudit, "id">
  preference_fit: Omit<PilotPreferenceFitEvent, "id">
  referral: Omit<PilotReferralEvent, "id">
  service_status: Omit<ServiceOperationalStatusEvent, "id">
}

export type PilotReplayEventKind = keyof PilotReplayPayloads

export const PILOT_EVENT_REPLAY_CRITERIA = {
  connection: [
    "pilot_cycle_id",
    "org_id",
    "service_id",
    "connected_at",
    "contact_attempt_event_id",
    "referral_event_id",
  ],
  contact_attempt: [
    "pilot_cycle_id",
    "service_id",
    "recorded_by_org_id",
    "entity_key_hash",
    "attempt_channel",
    "attempt_outcome",
    "attempted_at",
    "resolved_at",
    "outcome_notes_code",
  ],
  data_decay_audit: [
    "pilot_cycle_id",
    "org_id",
    "service_id",
    "audited_at",
    "is_fatal",
    "fatal_error_category",
    "verification_mode",
  ],
  preference_fit: ["pilot_cycle_id", "org_id", "cohort_label", "recorded_at", "preferred_via_careconnect"],
  referral: [
    "pilot_cycle_id",
    "source_org_id",
    "target_service_id",
    "referral_state",
    "created_at",
    "updated_at",
    "terminal_at",
    "failure_reason_code",
  ],
  service_status: ["pilot_cycle_id", "org_id", "service_id", "checked_at", "status_code"],
} satisfies {
  [Kind in PilotReplayEventKind]: readonly (keyof PilotReplayPayloads[Kind])[]
}

type JsonCompatible = boolean | number | string | null | JsonCompatible[] | { [key: string]: JsonCompatible }

export type PilotEventReplayMaterial<Kind extends PilotReplayEventKind = PilotReplayEventKind> = {
  criteria: Record<string, unknown>
  kind: Kind
}

function normalizeForHash(value: unknown): JsonCompatible {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeForHash(item))
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>
    const normalized: Record<string, JsonCompatible> = {}
    for (const key of Object.keys(record).sort()) {
      normalized[key] = normalizeForHash(record[key])
    }
    return normalized
  }

  return String(value)
}

export function buildPilotEventReplayMaterial<Kind extends PilotReplayEventKind>(
  kind: Kind,
  payload: PilotReplayPayloads[Kind]
): PilotEventReplayMaterial<Kind> {
  const criteria: Record<string, unknown> = {}
  const record = payload as Record<string, unknown>

  for (const key of PILOT_EVENT_REPLAY_CRITERIA[kind]) {
    criteria[String(key)] = record[String(key)] ?? null
  }

  return { kind, criteria }
}

export function buildPilotEventReplayFingerprint<Kind extends PilotReplayEventKind>(
  kind: Kind,
  payload: PilotReplayPayloads[Kind]
): string {
  const material = buildPilotEventReplayMaterial(kind, payload)
  const canonicalMaterial = JSON.stringify(normalizeForHash(material))

  return createHash("sha256").update(canonicalMaterial).digest("hex")
}

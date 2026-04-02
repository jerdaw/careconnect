import { z } from "zod"
import { ATTEMPT_CHANNELS, ATTEMPT_OUTCOMES, OUTCOME_NOTES_CODES } from "@/types/pilot-contact-attempt"
import { REFERRAL_FAILURE_REASON_CODES, REFERRAL_STATES } from "@/types/pilot-referral"
import {
  PILOT_DATA_DECAY_FATAL_ERROR_CATEGORIES,
  PILOT_DATA_DECAY_VERIFICATION_MODES,
  PILOT_SCOPE_SLA_TIERS,
  SERVICE_OPERATIONAL_STATUS_CODES,
} from "@/types/pilot-instrumentation"
import { findDisallowedPrivacyKeyPaths } from "@/lib/schemas/privacy-guards"

const AttemptChannelEnum = z.enum(ATTEMPT_CHANNELS)
const AttemptOutcomeEnum = z.enum(ATTEMPT_OUTCOMES)
const OutcomeNotesCodeEnum = z.enum(OUTCOME_NOTES_CODES)

const ReferralStateEnum = z.enum(REFERRAL_STATES)
const ReferralFailureReasonCodeEnum = z.enum(REFERRAL_FAILURE_REASON_CODES)
const ScopeSlaTierEnum = z.enum(PILOT_SCOPE_SLA_TIERS)
const ServiceOperationalStatusCodeEnum = z.enum(SERVICE_OPERATIONAL_STATUS_CODES)
const DataDecayFatalErrorCategoryEnum = z.enum(PILOT_DATA_DECAY_FATAL_ERROR_CATEGORIES)
const DataDecayVerificationModeEnum = z.enum(PILOT_DATA_DECAY_VERIFICATION_MODES)
const Sha256HexSchema = z.string().regex(/^[0-9a-fA-F]{64}$/, "entity_key_hash must be a SHA-256 hex digest")

function addPrivacyFieldIssues(value: unknown, context: z.RefinementCtx) {
  const disallowedPaths = findDisallowedPrivacyKeyPaths(value)
  for (const path of disallowedPaths) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Disallowed privacy field detected: ${path}`,
    })
  }
}

export const PilotContactAttemptCreateSchema = z
  .object({
    pilot_cycle_id: z.string().min(1).max(100),
    service_id: z.string().min(1).max(100),
    recorded_by_org_id: z.string().uuid(),
    entity_key_hash: Sha256HexSchema,
    attempt_channel: AttemptChannelEnum,
    attempt_outcome: AttemptOutcomeEnum,
    attempted_at: z.string().datetime(),
    resolved_at: z.string().datetime().optional(),
    outcome_notes_code: OutcomeNotesCodeEnum.optional(),
  })
  .strict()
  .superRefine(addPrivacyFieldIssues)

export const PilotReferralCreateSchema = z
  .object({
    pilot_cycle_id: z.string().min(1).max(100),
    source_org_id: z.string().uuid(),
    target_service_id: z.string().min(1).max(100),
    referral_state: ReferralStateEnum.default("initiated"),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    terminal_at: z.string().datetime().optional(),
    failure_reason_code: ReferralFailureReasonCodeEnum.optional(),
  })
  .strict()
  .superRefine(addPrivacyFieldIssues)

export const PilotConnectionCreateSchema = z
  .object({
    pilot_cycle_id: z.string().min(1).max(100),
    org_id: z.string().uuid(),
    service_id: z.string().min(1).max(100),
    connected_at: z.string().datetime(),
    contact_attempt_event_id: z.string().uuid().optional(),
    referral_event_id: z.string().uuid().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    addPrivacyFieldIssues(value, context)

    const anchorCount = Number(Boolean(value.contact_attempt_event_id)) + Number(Boolean(value.referral_event_id))
    if (anchorCount !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Exactly one of contact_attempt_event_id or referral_event_id is required",
      })
    }
  })

export const PilotServiceScopeCreateSchema = z
  .object({
    pilot_cycle_id: z.string().min(1).max(100),
    org_id: z.string().uuid(),
    service_id: z.string().min(1).max(100),
    sla_tier: ScopeSlaTierEnum,
  })
  .strict()
  .superRefine(addPrivacyFieldIssues)

export const ServiceOperationalStatusEventCreateSchema = z
  .object({
    pilot_cycle_id: z.string().min(1).max(100),
    org_id: z.string().uuid(),
    service_id: z.string().min(1).max(100),
    checked_at: z.string().datetime(),
    status_code: ServiceOperationalStatusCodeEnum,
  })
  .strict()
  .superRefine(addPrivacyFieldIssues)

export const PilotDataDecayAuditCreateSchema = z
  .object({
    pilot_cycle_id: z.string().min(1).max(100),
    org_id: z.string().uuid(),
    service_id: z.string().min(1).max(100),
    audited_at: z.string().datetime(),
    is_fatal: z.boolean(),
    fatal_error_category: DataDecayFatalErrorCategoryEnum.optional(),
    verification_mode: DataDecayVerificationModeEnum,
  })
  .strict()
  .superRefine((value, context) => {
    addPrivacyFieldIssues(value, context)

    if (value.is_fatal && !value.fatal_error_category) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fatal_error_category"],
        message: "fatal_error_category is required when is_fatal is true",
      })
    }

    if (!value.is_fatal && value.fatal_error_category) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fatal_error_category"],
        message: "fatal_error_category must be omitted when is_fatal is false",
      })
    }
  })

export const PilotPreferenceFitEventCreateSchema = z
  .object({
    pilot_cycle_id: z.string().min(1).max(100),
    org_id: z.string().uuid(),
    cohort_label: z.string().min(1).max(100),
    recorded_at: z.string().datetime(),
    preferred_via_helpbridge: z.boolean(),
  })
  .strict()
  .superRefine(addPrivacyFieldIssues)

export const PilotMetricsRecomputeSchema = z
  .object({
    pilot_cycle_id: z.string().min(1).max(100),
    org_id: z.string().uuid(),
  })
  .strict()
  .superRefine(addPrivacyFieldIssues)

const TERMINAL_REFERRAL_STATES: ReadonlySet<string> = new Set([
  "connected",
  "failed",
  "client_withdrew",
  "no_response_timeout",
])

export const PilotReferralUpdateSchema = z
  .object({
    source_org_id: z.string().uuid(),
    referral_state: ReferralStateEnum,
    updated_at: z.string().datetime(),
    terminal_at: z.string().datetime().optional(),
    failure_reason_code: ReferralFailureReasonCodeEnum.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    addPrivacyFieldIssues(value, context)

    if (TERMINAL_REFERRAL_STATES.has(value.referral_state) && !value.terminal_at) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["terminal_at"],
        message: "terminal_at is required when setting a terminal referral_state",
      })
    }

    if (value.referral_state === "initiated" && value.failure_reason_code) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["failure_reason_code"],
        message: "failure_reason_code is not valid for initiated state",
      })
    }
  })

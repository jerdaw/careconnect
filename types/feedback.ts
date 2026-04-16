import { z } from "zod"
import {
  PARTNER_SERVICE_EDIT_FIELDS,
  PartnerServiceEditFieldKeySchema,
  PartnerServiceEditSchema,
} from "@/lib/schemas/service-partner-edit"

/**
 * Feedback Types
 */
export const FeedbackTypeEnum = z.enum(["helpful_yes", "helpful_no", "issue", "not_found"])

export type FeedbackType = z.infer<typeof FeedbackTypeEnum>

/**
 * Valid search categories for 'not_found' feedback
 */
export const FeedbackCategoryEnum = z.enum([
  "Food",
  "Crisis",
  "Housing",
  "Health",
  "Legal",
  "Financial",
  "Employment",
  "Education",
  "Transport",
  "Community",
  "Indigenous",
  "Wellness",
])

/**
 * Zod Schema for submitting feedback
 */
export const FeedbackSubmitSchema = z.object({
  service_id: z.string().optional(), // Optional for 'not_found' global feedback
  feedback_type: FeedbackTypeEnum,

  // Message is optional for simple thumbs up/down, required for others might be enforced in UI but schema allows optional
  message: z.string().max(1000, "Message must be 1000 characters or less").optional(),

  // Only relevant for 'not_found'
  category_searched: FeedbackCategoryEnum.optional(),
})

export type FeedbackSubmitPayload = z.infer<typeof FeedbackSubmitSchema>

/**
 * Database Feedback Record Interface
 */
export interface FeedbackRecord {
  id: string
  service_id: string | null
  feedback_type: FeedbackType
  message: string | null
  category_searched: string | null
  status: "pending" | "reviewed" | "resolved" | "dismissed"
  resolved_at: string | null
  resolved_by: string | null
  created_at: string
}

export const SERVICE_UPDATE_FIELDS = PARTNER_SERVICE_EDIT_FIELDS

export const NULLABLE_SERVICE_UPDATE_FIELDS = [
  "name_fr",
  "description_fr",
  "phone",
  "url",
  "address",
  "hours_text",
  "eligibility_notes",
  "eligibility_notes_fr",
  "access_script",
  "access_script_fr",
] as const

export const TEXT_SERVICE_UPDATE_FIELDS = [
  "name",
  "name_fr",
  "description",
  "description_fr",
  "phone",
  "url",
  "address",
  "hours_text",
  "eligibility_notes",
  "eligibility_notes_fr",
  "access_script",
  "access_script_fr",
] as const

export const ServiceUpdateFieldKeySchema = PartnerServiceEditFieldKeySchema

export const ServiceUpdateFieldUpdatesSchema = PartnerServiceEditSchema

export const ServiceUpdateSubmitSchema = z.object({
  field_updates: ServiceUpdateFieldUpdatesSchema,
  justification: z.string().trim().max(500).optional(),
})

export type ServiceUpdateFieldKey = z.infer<typeof ServiceUpdateFieldKeySchema>
export type ServiceUpdateFieldUpdates = z.infer<typeof ServiceUpdateFieldUpdatesSchema>
export type ServiceUpdateSubmitPayload = z.infer<typeof ServiceUpdateSubmitSchema>

/**
 * Service Update Request Interface
 */
export interface ServiceUpdateRequest {
  id: string
  service_id: string
  requested_by: string // Partner email or ID
  field_updates: ServiceUpdateFieldUpdates
  justification: string | null
  status: "pending" | "approved" | "rejected"
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
}

/**
 * API Response Interface
 */
export interface FeedbackApiResponse {
  success: boolean
  message?: string
  id?: string
}

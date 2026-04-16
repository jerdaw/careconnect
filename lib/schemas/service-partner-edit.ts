import { z } from "zod"
import type { ServiceUpdate } from "@/lib/service-db"

export const PARTNER_SERVICE_EDIT_FIELDS = [
  "name",
  "name_fr",
  "description",
  "description_fr",
  "phone",
  "url",
  "address",
  "hours_text",
  "operating_hours",
  "eligibility_notes",
  "eligibility_notes_fr",
  "access_script",
  "access_script_fr",
] as const

export const DIRECT_SERVICE_WRITE_UNSUPPORTED_FIELDS = ["access_script", "access_script_fr"] as const

const nonEmptyString = (max: number) => z.string().trim().min(1).max(max)
const nullableString = (max: number) => nonEmptyString(max).nullable().optional()

export const PartnerServiceEditFieldKeySchema = z.enum(PARTNER_SERVICE_EDIT_FIELDS)

export const PartnerServiceEditSchema = z
  .object({
    name: nonEmptyString(200).optional(),
    name_fr: nullableString(200),
    description: nonEmptyString(2000).optional(),
    description_fr: nullableString(2000),
    phone: z
      .string()
      .trim()
      .regex(/^[\d\s\-\(\)\+]+$/, "Invalid phone format")
      .nullable()
      .optional(),
    url: z.string().trim().url("Invalid URL").nullable().optional(),
    address: nullableString(500),
    hours_text: nullableString(200),
    operating_hours: nullableString(200),
    eligibility_notes: nullableString(500),
    eligibility_notes_fr: nullableString(500),
    access_script: nullableString(2000),
    access_script_fr: nullableString(2000),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field update is required",
  })

export type PartnerServiceEditInput = z.infer<typeof PartnerServiceEditSchema>
export type PartnerServiceEditFieldKey = z.infer<typeof PartnerServiceEditFieldKeySchema>

export function normalizePartnerServiceEditInput(input: PartnerServiceEditInput): PartnerServiceEditInput {
  if (input.hours_text !== undefined || input.operating_hours === undefined) {
    return input
  }

  return {
    ...input,
    hours_text: input.operating_hours,
  }
}

export function getDirectServiceWriteUnsupportedFields(input: PartnerServiceEditInput): string[] {
  return DIRECT_SERVICE_WRITE_UNSUPPORTED_FIELDS.filter((field) => input[field] !== undefined)
}

export function mapPartnerServiceEditToServiceUpdate(input: PartnerServiceEditInput): ServiceUpdate {
  const normalized = normalizePartnerServiceEditInput(input)
  const updates: ServiceUpdate = {}

  if (normalized.name !== undefined) updates.name = normalized.name
  if (normalized.name_fr !== undefined) updates.name_fr = normalized.name_fr
  if (normalized.description !== undefined) updates.description = normalized.description
  if (normalized.description_fr !== undefined) updates.description_fr = normalized.description_fr
  if (normalized.phone !== undefined) updates.phone = normalized.phone
  if (normalized.url !== undefined) updates.url = normalized.url
  if (normalized.address !== undefined) updates.address = normalized.address
  if (normalized.hours_text !== undefined) updates.hours_text = normalized.hours_text
  if (normalized.eligibility_notes !== undefined) updates.eligibility = normalized.eligibility_notes
  if (normalized.eligibility_notes_fr !== undefined) updates.eligibility_fr = normalized.eligibility_notes_fr

  return updates
}

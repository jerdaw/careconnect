import { z } from "zod"
import { IntentCategorySchema, ScopeSchema, IdentityTagSchema, ServiceHoursSchema } from "./service"

/**
 * Schema for creating a new service via POST /api/v1/services.
 * Excludes server-managed fields like id, provenance, embedding.
 */
export const ServiceCreateSchema = z
  .object({
    // Core Required Fields
    name: z.string().min(1, "Name is required").max(200),
    description: z.string().min(10, "Description must be at least 10 characters").max(2000),
    intent_category: IntentCategorySchema,

    // Contact (at least one required)
    url: z.string().url().optional().or(z.literal("")),
    phone: z
      .string()
      .regex(/^[\d\s\-\(\)\+]+$/, "Invalid phone format")
      .optional(),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().max(500).optional(),

    // Bilingual
    name_fr: z.string().max(200).optional(),
    description_fr: z.string().max(2000).optional(),
    address_fr: z.string().max(500).optional(),

    // Optional Fields
    fees: z.string().max(500).optional(),
    eligibility: z.string().max(1000).optional(),
    eligibility_notes: z.string().max(500).optional(),
    application_process: z.string().max(1000).optional(),
    documents_required: z.string().max(500).optional(),
    languages: z.array(z.string()).max(20).optional(),
    bus_routes: z.array(z.string()).max(10).optional(),
    hours: ServiceHoursSchema.optional(),
    hours_text: z.string().max(200).optional(),
    scope: ScopeSchema.optional(),
    virtual_delivery: z.boolean().optional(),
    cultural_safety: z.boolean().optional(),
    identity_tags: z.array(IdentityTagSchema).max(10).optional(),

    // Coordinates (validated separately)
    coordinates: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .optional(),
    org_id: z.string().uuid().optional(),
  })
  .refine((data) => data.url || data.phone || data.address, {
    message: "At least one contact method required (url, phone, or address)",
    path: ["url"],
  })
  .refine(
    (data) => {
      if (data.intent_category === "Crisis") {
        return !!data.phone
      }
      return true
    },
    {
      message: "Crisis services require a phone number",
      path: ["phone"],
    }
  )

export type ServiceCreateInput = z.infer<typeof ServiceCreateSchema>

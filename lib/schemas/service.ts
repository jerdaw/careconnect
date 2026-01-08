import { z } from "zod"

// Verification levels matching types/service.ts
export const VerificationLevelSchema = z.enum(["L0", "L1", "L2", "L3"])

// Intent categories
export const IntentCategorySchema = z.enum([
  "Food",
  "Crisis",
  "Housing",
  "Health",
  "Legal",
  "Wellness",
  "Financial",
  "Employment",
  "Education",
  "Transport",
  "Community",
  "Indigenous",
])

// v11.0: Service scope for geographic availability
export const ScopeSchema = z.enum(["kingston", "ontario", "canada"])

// Identity tag with evidence
export const IdentityTagSchema = z.object({
  tag: z.string().min(1, "Tag cannot be empty"),
  evidence_url: z.string().url("Evidence URL must be a valid URL"),
})

// Provenance information
export const ProvenanceSchema = z.object({
  verified_by: z.string().min(1),
  verified_at: z.string().datetime({ message: "Must be ISO 8601 datetime" }),
  evidence_url: z.string().url(),
  method: z.string().min(1),
})

// Structured operating hours
export const ServiceHoursSchema = z.object({
  monday: z.object({ open: z.string(), close: z.string() }).optional(),
  tuesday: z.object({ open: z.string(), close: z.string() }).optional(),
  wednesday: z.object({ open: z.string(), close: z.string() }).optional(),
  thursday: z.object({ open: z.string(), close: z.string() }).optional(),
  friday: z.object({ open: z.string(), close: z.string() }).optional(),
  saturday: z.object({ open: z.string(), close: z.string() }).optional(),
  sunday: z.object({ open: z.string(), close: z.string() }).optional(),
  notes: z.string().optional(),
})

// Main Service schema
export const ServiceSchema = z
  .object({
    // Core Identity (Required)
    id: z.string().min(1, "ID is required"),
    name: z.string().min(1, "Name is required"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    verification_level: VerificationLevelSchema,
    intent_category: IntentCategorySchema,
    provenance: ProvenanceSchema,
    identity_tags: z.array(IdentityTagSchema),
    synthetic_queries: z.array(z.string()),

    // Contact (at least one required - validated via refine)
    url: z.string().url().optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),

    // Bilingual (validated via refine)
    name_fr: z.string().optional(),
    description_fr: z.string().optional(),
    address_fr: z.string().optional(),
    eligibility_notes: z.string().optional(),
    eligibility_notes_fr: z.string().optional(),
    synthetic_queries_fr: z.array(z.string()).optional(),
    access_script: z.string().optional(),
    access_script_fr: z.string().optional(),

    // Location
    coordinates: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .optional(),

    // Scheduling
    hours: ServiceHoursSchema.optional(),

    // Additional fields
    fees: z.string().optional(),
    eligibility: z.string().optional(),
    application_process: z.string().optional(),
    languages: z.array(z.string()).optional(),
    bus_routes: z.array(z.string()).optional(),
    accessibility: z.record(z.boolean()).optional(),
    last_verified: z.string().optional(),
    cultural_safety: z.boolean().optional(),
    // v11.0: Scope expansion fields
    scope: ScopeSchema.optional(),
    virtual_delivery: z.boolean().optional(),
    primary_phone_label: z.string().optional(),
    service_area: z.string().optional(),
    // @deprecated: Use scope instead
    is_provincial: z.boolean().optional(),
    org_id: z.string().optional(),
    embedding: z.array(z.number()).optional(),
  })
  // Custom validation: at least one contact method
  .refine(
    (data) => data.url || data.phone || data.address,
    {
      message: "At least one contact method required (url, phone, or address)",
      path: ["url"],
    }
  )
  // Custom validation: Crisis services require phone
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
  // Custom validation: Bilingual - either name_fr present or flag
  .refine(
    () => {
      // For now, we just warn if name_fr is missing
      // In strict mode, this would fail validation
      return true
    },
    {
      message: "French translation recommended for name",
      path: ["name_fr"],
    }
  )

export type ValidatedService = z.infer<typeof ServiceSchema>

// Array of services
export const ServicesArraySchema = z.array(ServiceSchema)

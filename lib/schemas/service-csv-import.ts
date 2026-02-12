import { z } from "zod"
import { IntentCategorySchema } from "./service"
import type { ServiceCreateInput } from "./service-create"

/**
 * CSV Import Schema
 *
 * Lenient schema for CSV imports that accepts string inputs and validates/transforms
 * them into the proper ServiceCreateInput format. Designed to catch common CSV issues:
 * - Missing required fields
 * - Invalid email/URL/phone formats
 * - Invalid category values
 * - Empty or whitespace-only values
 *
 * Security: Prevents malformed data from reaching the API by validating at the UI layer.
 */

/**
 * Map of common CSV header variations to canonical field names
 */
export const CSV_FIELD_MAPPING: Record<string, string> = {
  // Name variations
  name: "name",
  Name: "name",
  "Service Name": "name",
  service_name: "name",

  // Description variations
  description: "description",
  Description: "description",
  desc: "description",
  Desc: "description",

  // Category variations
  category: "intent_category",
  Category: "intent_category",
  intent_category: "intent_category",
  "Intent Category": "intent_category",
  type: "intent_category",
  Type: "intent_category",

  // Contact variations
  phone: "phone",
  Phone: "phone",
  telephone: "phone",
  Telephone: "phone",

  email: "email",
  Email: "email",
  "Email Address": "email",

  url: "url",
  URL: "url",
  website: "url",
  Website: "url",
  link: "url",
  Link: "url",

  address: "address",
  Address: "address",
  location: "address",
  Location: "address",

  // Optional fields
  fees: "fees",
  Fees: "fees",
  cost: "fees",
  Cost: "fees",

  eligibility: "eligibility",
  Eligibility: "eligibility",

  hours: "hours_text",
  Hours: "hours_text",
  hours_text: "hours_text",
  "Operating Hours": "hours_text",
}

/**
 * Normalize CSV headers to canonical field names
 */
export function normalizeCSVHeaders(headers: string[]): string[] {
  return headers.map((h) => CSV_FIELD_MAPPING[h.trim()] || h.trim())
}

/**
 * CSV Row Schema - accepts all fields as optional strings from CSV
 * Validates format and transforms to ServiceCreateInput
 */
export const CSVImportRowSchema = z
  .object({
    // Required fields
    name: z
      .string()
      .min(1, "Name is required")
      .max(200, "Name must be 200 characters or less")
      .transform((val) => val.trim()),

    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(2000, "Description must be 2000 characters or less")
      .transform((val) => val.trim()),

    intent_category: z
      .string()
      .min(1, "Category is required")
      .transform((val) => val.trim())
      .pipe(IntentCategorySchema.or(z.enum(["Other"]).transform(() => "Community" as const))),

    // Contact fields (at least one required, validated in refine)
    phone: z
      .string()
      .optional()
      .transform((val) => (val && val.trim() ? val.trim() : undefined))
      .pipe(
        z
          .string()
          .regex(/^[\d\s\-\(\)\+]+$/, "Invalid phone format")
          .optional()
      ),

    email: z
      .string()
      .optional()
      .transform((val) => (val && val.trim() ? val.trim() : undefined))
      .pipe(z.string().email("Invalid email format").optional()),

    url: z
      .string()
      .optional()
      .transform((val) => (val && val.trim() ? val.trim() : undefined))
      .pipe(z.string().url("Invalid URL format").optional()),

    address: z
      .string()
      .optional()
      .transform((val) => (val && val.trim() ? val.trim() : undefined))
      .pipe(z.string().max(500).optional()),

    // Optional fields
    fees: z
      .string()
      .optional()
      .transform((val) => (val && val.trim() ? val.trim() : undefined))
      .pipe(z.string().max(500).optional()),

    eligibility: z
      .string()
      .optional()
      .transform((val) => (val && val.trim() ? val.trim() : undefined))
      .pipe(z.string().max(1000).optional()),

    hours_text: z
      .string()
      .optional()
      .transform((val) => (val && val.trim() ? val.trim() : undefined))
      .pipe(z.string().max(200).optional()),
  })
  .strict() // Reject unknown fields
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

export type CSVImportRow = z.infer<typeof CSVImportRowSchema>

/**
 * Validation result for a single CSV row
 */
export interface CSVRowValidationResult {
  rowIndex: number
  isValid: boolean
  data?: ServiceCreateInput
  errors?: Array<{ field: string; message: string }>
}

/**
 * Validate a CSV row against the schema
 * Returns validation result with detailed error messages
 */
export function validateCSVRow(row: Record<string, string>, rowIndex: number): CSVRowValidationResult {
  const result = CSVImportRowSchema.safeParse(row)

  if (result.success) {
    return {
      rowIndex,
      isValid: true,
      data: result.data as unknown as ServiceCreateInput,
    }
  }

  // Extract field-level errors
  const errors = result.error.issues.map((issue) => ({
    field: issue.path.join(".") || "unknown",
    message: issue.message,
  }))

  return {
    rowIndex,
    isValid: false,
    errors,
  }
}

/**
 * Batch validate multiple CSV rows
 * Returns array of validation results
 */
export function validateCSVBatch(rows: Record<string, string>[]): CSVRowValidationResult[] {
  return rows.map((row, index) => validateCSVRow(row, index + 1)) // 1-indexed for user display
}

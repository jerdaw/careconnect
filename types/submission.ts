import { z } from "zod"

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z.string().optional()
)

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().url("Invalid URL format").optional()
)

const optionalEmail = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().email("Invalid email format").optional()
)

export const SubmissionSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  phone: optionalTrimmedString,
  url: optionalUrl,
  address: optionalTrimmedString,
  submitted_by_email: optionalEmail,
})

export type SubmissionPayload = z.infer<typeof SubmissionSchema>

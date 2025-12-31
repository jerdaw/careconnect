import { z } from "zod"

export const SubmissionSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  phone: z.string().optional(),
  url: z.string().url("Invalid URL format").optional().or(z.literal("")),
  address: z.string().optional(),
})

export type SubmissionPayload = z.infer<typeof SubmissionSchema>

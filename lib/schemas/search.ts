
import { z } from "zod"

export const SUPPORTED_LOCALES = ["en", "fr", "ar", "zh-Hans", "es"] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const searchRequestSchema = z.object({
  query: z.string().max(500).optional().default(""),
  locale: z.enum(SUPPORTED_LOCALES),
  filters: z.object({
    category: z.string().optional(),
    // Future: verificationLevels, openNow, etc.
  }).optional().default({}),
  options: z.object({
    limit: z.number().min(1).max(100).optional().default(20),
    offset: z.number().min(0).optional().default(0),
  }).optional().default({}),
})

export type SearchRequest = z.infer<typeof searchRequestSchema>

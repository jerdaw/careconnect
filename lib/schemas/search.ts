import { z } from "zod"

export const SUPPORTED_LOCALES = ["en", "fr", "ar", "zh-Hans", "es", "pa", "pt"] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const searchRequestSchema = z.object({
  query: z.string().max(500).optional().default(""),
  locale: z.enum(SUPPORTED_LOCALES),
  filters: z
    .object({
      category: z.string().optional(),
      openNow: z.boolean().optional(),
    })
    .optional()
    .default({}),
  options: z
    .object({
      limit: z.number().min(1).max(100).optional().default(20),
      offset: z.number().min(0).optional().default(0),
    })
    .optional()
    .default({}),
  // NEW: Location for proximity scoring
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
})

export type SearchRequest = z.infer<typeof searchRequestSchema>

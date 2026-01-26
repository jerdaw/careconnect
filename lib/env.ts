import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    SUPABASE_SECRET_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    ONESIGNAL_REST_API_KEY: z.string().optional(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    // Circuit Breaker Configuration (v17.5+)
    CIRCUIT_BREAKER_ENABLED: z
      .string()
      .optional()
      .default("true")
      .transform((val) => val !== "false"),
    CIRCUIT_BREAKER_FAILURE_THRESHOLD: z
      .string()
      .optional()
      .default("3")
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().positive().max(100)),
    CIRCUIT_BREAKER_TIMEOUT: z
      .string()
      .optional()
      .default("30000")
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().positive().max(300000)), // Max 5 minutes
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional().or(z.literal("")),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_ONESIGNAL_APP_ID: z.string().optional(),
    // Performance Tracking (v17.5+)
    NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING: z
      .string()
      .optional()
      .default("false")
      .transform((val) => val === "true"),
  },
  // If you're using Next.js < 13.4.4, you'll need to specify the runtimeEnv manually
  // runtimeEnv: {
  //   NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  //   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  //   ...
  // },
  // For Next.js >= 13.4.4, you only need to destructure client vars:
  experimental__runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ONESIGNAL_APP_ID: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
    NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING: process.env.NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING,
  },
})

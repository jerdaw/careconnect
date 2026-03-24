import { afterEach, beforeEach, vi } from "vitest"
import type { MockInstance } from "vitest"

const requiredEnv = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_JWT_SECRET"] as const

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required DB test environment variable: ${key}`)
  }
}

process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_ANON_KEY
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
process.env.NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING = "false"

const silentConsoleMethods = ["log", "info", "warn", "error", "debug"] as const
const shouldSilenceTestConsole = process.env.VITEST_VERBOSE_LOGS !== "1"
const consoleSilencers: Partial<Record<(typeof silentConsoleMethods)[number], MockInstance>> = {}

beforeEach(() => {
  if (!shouldSilenceTestConsole) return

  for (const method of silentConsoleMethods) {
    consoleSilencers[method] = vi.spyOn(console, method).mockImplementation(() => {})
  }
})

afterEach(() => {
  for (const method of silentConsoleMethods) {
    consoleSilencers[method]?.mockRestore()
    delete consoleSilencers[method]
  }
  vi.clearAllMocks()
})

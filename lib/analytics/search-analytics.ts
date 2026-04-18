import { getSupabaseClient, SupabaseNotConfiguredError } from "@/lib/supabase"
import { logger } from "@/lib/logger"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"

export interface SearchEvent {
  locale: string
  resultCount: number
}

/**
 * Logs a privacy-safe search event to Supabase.
 * Strictly avoids logging the actual query text to protect user privacy.
 */
export async function trackSearchEvent(event: SearchEvent) {
  let supabase
  try {
    supabase = getSupabaseClient()
  } catch (error) {
    if (error instanceof SupabaseNotConfiguredError) {
      logger.warn("Supabase not configured, skipping analytics")
      return
    }
    throw error
  }

  try {
    const { error } = await withCircuitBreaker(async () =>
      supabase.from("search_analytics").insert({
        query: null,
        results_count: event.resultCount,
        locale: event.locale,
      })
    )

    if (error) {
      logger.warn("Failed to log search analytics", { reason: error.message })
    }
  } catch (err) {
    // Silently fail to avoid disrupting user experience
    logger.warn("Analytics error", { err })
  }
}

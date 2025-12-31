import { createClient, SupabaseClient } from "@supabase/supabase-js"

// Initialize Supabase client lazily or safely
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabase: SupabaseClient | null = null

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
}

export interface SearchEvent {
  category: string | null
  resultCount: number
  hasLocation: boolean
}

/**
 * Logs a privacy-safe search event to Supabase.
 * Strictly avoids logging the actual query text to protect user privacy.
 */
export async function trackSearchEvent(event: SearchEvent) {
  if (!supabase) {
    console.warn("Supabase not configured, skipping analytics")
    return
  }

  try {
    let bucket = "5+"
    if (event.resultCount === 0) bucket = "0"
    else if (event.resultCount <= 5) bucket = "1-5"

    const { error } = await supabase.from("search_analytics").insert({
      category: event.category || "All",
      result_count_bucket: bucket,
      has_location: event.hasLocation,
    })

    if (error) {
      console.warn("Failed to log search analytics:", error.message)
    }
  } catch (err) {
    // Silently fail to avoid disrupting user experience
    console.warn("Analytics error:", err)
  }
}

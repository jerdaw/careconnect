import { createClient } from "@supabase/supabase-js"

// Environment variables must be set in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "⚠️ Supabase credentials not found. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set."
  )
}

/**
 * Universal Supabase Client
 * Safe to use in Client Components and Static Generation.
 */
export const supabase = createClient(supabaseUrl || "", supabaseKey || "", {
  auth: {
    persistSession: typeof window !== "undefined",
  },
})

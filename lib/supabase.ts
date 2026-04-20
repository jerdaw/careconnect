import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { Database } from "@/types/supabase"

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super("Supabase credentials not configured")
    this.name = "SupabaseNotConfiguredError"
  }
}

export function hasSupabaseCredentials() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
}

let supabaseClient: SupabaseClient<Database> | null = null

/**
 * Lazily create the shared Supabase client so builds can complete without
 * production credentials at image-build time.
 */
export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new SupabaseNotConfiguredError()
  }

  supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: typeof window !== "undefined",
    },
  })

  return supabaseClient
}

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseClient() as object, prop, receiver)
  },
})

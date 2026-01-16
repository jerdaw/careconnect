import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import { Database } from "../types/supabase"

// Load env vars
dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !anonKey) {
  console.error("❌ Missing Supabase credentials.")
  process.exit(1)
}

// Create client with ANON key (RLS applied)
const supabase = createClient<Database>(supabaseUrl, anonKey)

async function checkVisibility() {
  console.log("Checking visibility of crisis-988 as ANON user...")

  // Try to find it in services_public view
  const { data, error } = await supabase.from("services_public").select("*").eq("id", "crisis-988")

  if (error) {
    console.error("Error:", error)
    return
  }

  if (!data || data.length === 0) {
    console.log("❌ Service 'crisis-988' is NOT visible to Anon user.")
  } else {
    console.log("✅ Service 'crisis-988' IS visible to Anon user.")
    console.log(data[0])
  }
}

checkVisibility()

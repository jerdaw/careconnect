import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import { supabase } from "../lib/supabase"

async function checkDb() {
  console.log("🔍 Checking Supabase Data...")

  // Check Services
  const { count, error } = await supabase.from("services").select("*", { count: "exact", head: true })

  if (error) {
    console.error("❌ Error checking services:", error.message)
    return
  }

  console.log(`✅ Services Row Count: ${count}`)

  if (count === 0) {
    console.warn("⚠️  Database is empty! You need to run migration.")
    return
  }

  // Check one row for embedding
  const { data } = await supabase.from("services").select("embedding").limit(1)
  if (data && data.length > 0) {
    const hasEmbedding = !!data[0]?.embedding
    console.log(`✅ Embedding Column Populated: ${hasEmbedding}`)
  }
}

checkDb()

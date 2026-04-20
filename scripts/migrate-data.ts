import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"
import { Service } from "../types/service"
import { Database } from "../types/supabase"
import dotenv from "dotenv"
import { fileURLToPath } from "url"
import { mapServiceToDatabaseUpsert } from "@/lib/service-db"

// Load env vars
dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing Supabase credentials. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local")
  process.exit(1)
}

// Admin client with ability to write to DB
const supabase = createClient<Database>(supabaseUrl, serviceRoleKey)

// Get current directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function migrate() {
  console.log("🚀 Starting migration...")

  // Read JSON
  const dataPath = path.join(__dirname, "../data/services.json")
  const rawData = fs.readFileSync(dataPath, "utf-8")
  const services = JSON.parse(rawData) as Service[]

  console.log(`📦 Found ${services.length} services to migrate.`)

  // Read Embeddings
  const embeddingsPath = path.join(__dirname, "../data/embeddings.json")
  const embeddingsRaw = fs.readFileSync(embeddingsPath, "utf-8")
  const embeddings = JSON.parse(embeddingsRaw) as Record<string, number[]>

  console.log(`📦 Found ${Object.keys(embeddings).length} embeddings to merge.`)

  let successCount = 0
  let errorCount = 0

  for (const service of services) {
    const dbRow = mapServiceToDatabaseUpsert({
      ...service,
      embedding: service.embedding || embeddings[service.id],
    })

    const { error } = await supabase.from("services").upsert(dbRow, { onConflict: "id" })

    if (error) {
      console.error(`❌ Error migrating ${service.name}:`, error.message)
      errorCount++
    } else {
      // console.log(`✅ Migrated: ${service.name}`);
      successCount++
    }
  }

  console.log(`\n🎉 Migration Complete!`)
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Failed: ${errorCount}`)
}

migrate()

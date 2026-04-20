import { createClient } from "@supabase/supabase-js"
import fs from "node:fs"
import path from "node:path"
import dotenv from "dotenv"
import { fileURLToPath } from "node:url"
import { mapServiceToDatabaseUpsert, type ServiceRow } from "@/lib/service-db"
import { buildCuratedRuntimeBackfillUpdate, CURATED_RUNTIME_BACKFILL_FIELDS } from "@/lib/service-db-backfill"
import type { Service } from "@/types/service"
import type { Database } from "@/types/supabase"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing Supabase credentials. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local")
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function findMissingServiceColumns(columns: string[]): Promise<string[]> {
  const missing: string[] = []

  for (const column of columns) {
    const { error } = await supabase.from("services").select(`id, ${column}`).limit(1)
    if (error?.message?.includes(`Could not find the '${column}' column`)) {
      missing.push(column)
    } else if (error) {
      throw error
    }
  }

  return missing
}

async function main() {
  console.log("🚀 Backfilling DB-authoritative runtime fields from curated services.json...")

  const missingColumns = await findMissingServiceColumns([...CURATED_RUNTIME_BACKFILL_FIELDS])
  if (missingColumns.length > 0) {
    console.error("")
    console.error("❌ Target Supabase schema is missing required columns for this rollout:")
    for (const column of missingColumns) {
      console.error(`   - services.${column}`)
    }
    console.error("")
    console.error(
      "Reconcile the live services table schema with the repo/local schema first, then rerun npm run backfill:db-runtime-fields."
    )
    process.exit(1)
  }

  const servicesPath = path.join(__dirname, "../data/services.json")
  const services = JSON.parse(fs.readFileSync(servicesPath, "utf-8")) as Service[]

  const embeddingsPath = path.join(__dirname, "../data/embeddings.json")
  const embeddings = JSON.parse(fs.readFileSync(embeddingsPath, "utf-8")) as Record<string, number[]>

  let inserted = 0
  let updated = 0
  let unchanged = 0
  let errors = 0

  for (const service of services) {
    const curatedRow = mapServiceToDatabaseUpsert({
      ...service,
      embedding: service.embedding || embeddings[service.id],
    })

    const { data: existingRow, error: readError } = await supabase
      .from("services")
      .select("*")
      .eq("id", service.id)
      .maybeSingle()

    if (readError) {
      console.error(`❌ Failed to load ${service.id}: ${readError.message}`)
      errors++
      continue
    }

    if (!existingRow) {
      const { error: insertError } = await supabase.from("services").upsert(curatedRow, { onConflict: "id" })
      if (insertError) {
        console.error(`❌ Failed to insert missing ${service.id}: ${insertError.message}`)
        errors++
      } else {
        inserted++
      }
      continue
    }

    const backfillUpdate = buildCuratedRuntimeBackfillUpdate(existingRow as ServiceRow, {
      ...service,
      embedding: service.embedding || embeddings[service.id],
    })

    if (Object.keys(backfillUpdate).length === 0) {
      unchanged++
      continue
    }

    const { error: updateError } = await supabase.from("services").update(backfillUpdate).eq("id", service.id)

    if (updateError) {
      console.error(`❌ Failed to update ${service.id}: ${updateError.message}`)
      errors++
      continue
    }

    updated++
  }

  console.log("")
  console.log("✅ DB runtime backfill complete")
  console.log(`Inserted missing rows: ${inserted}`)
  console.log(`Updated existing rows: ${updated}`)
  console.log(`Already complete: ${unchanged}`)
  console.log(`Errors: ${errors}`)
}

void main()

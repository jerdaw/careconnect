import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import { Database } from "../types/supabase"

// Load env vars
dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// Use SERVICE_ROLE_KEY to bypass RLS for administrative verification
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing Supabase credentials. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local")
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey)

async function verifyIntegrity() {
  console.log("🕵️‍♀️ Starting Data Integrity Verification...\n")
  let errors = 0

  // 1. Check Row Count (Ghost Data)
  const { count, error: countError } = await supabase.from("services").select("*", { count: "exact", head: true })

  if (countError) {
    console.error(`❌ Fatal: Could not fetch row count. ${countError.message}`)
    process.exit(1)
  }

  console.log(`📊 Total Services: ${count}`)

  if (count === null || count < 50) {
    console.error(`❌ Failure: Row count is suspiciously low (${count}). Expected > 50.`)
    errors++
  } else {
    console.log(`✅ Row count healthy.`)
  }

  // 2. Check Embedding Health
  // We select ID and embedding to check for nulls
  const { data: services, error: fetchError } = (await supabase.from("services").select("id, name, embedding")) as {
    data: { id: string; name: string; embedding: string | null }[] | null
    error: any
  }

  if (fetchError) {
    console.error(`❌ Fatal: Could not fetch services for inspection. ${fetchError.message}`)
    process.exit(1)
  }

  if (!services || services.length === 0) {
    console.error(`❌ Failure: No services returned.`)
    process.exit(1)
  }

  const servicesWithEmbeddings = services.filter((s) => s.embedding !== null && s.embedding.length > 0)
  const coverage = servicesWithEmbeddings.length / services.length

  console.log(
    `🧠 Embedding Coverage: ${(coverage * 100).toFixed(1)}% (${servicesWithEmbeddings.length}/${services.length})`
  )

  if (coverage < 0.95) {
    console.error(`❌ Failure: Embedding coverage is below 95%.`)
    // List offenders (max 5)
    const offenders = services.filter((s) => s.embedding === null).slice(0, 5)
    offenders.forEach((s) => console.log(`   - Missing embedding: [${s.id}] ${s.name}`))
    errors++
  } else {
    console.log(`✅ Embedding coverage healthy.`)
  }

  // 3. Check Bilingual Health (Basic)
  // Check if name_fr is populated for a random sample or all
  const { data: bilingualSample, error: frError } = await supabase
    .from("services")
    .select("id, name, name_fr")
    .not("name_fr", "is", null) // Filter where name_fr IS NOT NULL
    .limit(10) // Start with just ensuring *some* exist

  // Actually, let's just count how many have name_fr set vs total
  const { count: frCount } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .not("name_fr", "is", null)

  const frCoverage = (frCount || 0) / (count || 1)
  console.log(`🇫🇷 French Translation Coverage: ${(frCoverage * 100).toFixed(1)}%`)

  if (frCoverage < 0.1) {
    console.warn(`⚠️  Warning: Low French translation coverage. Is this expected?`)
  } else {
    console.log(`✅ Translation coverage acceptable.`)
  }

  console.log("\n" + "=".repeat(40))
  if (errors > 0) {
    console.error(`❌ Verification FAILED with ${errors} critical errors.`)
    process.exit(1)
  } else {
    console.log(`🎉 Verification PASSED. Database integrity confirmed.`)
    process.exit(0)
  }
}

verifyIntegrity()

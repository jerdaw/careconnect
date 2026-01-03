import fs from "fs/promises"
import path from "path"
import { Service, IntentCategory } from "../types/service"

async function runAudit() {
  console.log("🔍 Starting Data Quality Audit...")
  
  const servicesPath = path.join(process.cwd(), "data", "services.json")
  const servicesRaw = await fs.readFile(servicesPath, "utf-8")
  const services = JSON.parse(servicesRaw) as Service[]

  const errors: string[] = []
  const warnings: string[] = []
  const ids = new Set<string>()

  // 1. Unique IDs
  services.forEach(s => {
    if (ids.has(s.id)) errors.push(`Duplicate ID: ${s.id}`)
    ids.add(s.id)
  })

  if (errors.length === 0) console.log("✅ Unique IDs check passed")

  // 2. Required Fields
  services.forEach(s => {
    if (!s.name) errors.push(`${s.id}: Missing name`)
    if (!s.description) errors.push(`${s.id}: Missing description`)
    if (!s.intent_category) errors.push(`${s.id}: Missing category`)
    if (!s.verification_level) errors.push(`${s.id}: Missing verification level`)
    
    // Check for at least one contact method
    if (!s.phone && !s.url && !s.email && !s.address) {
      warnings.push(`${s.id}: No contact method (phone, url, email, or address)`)
    }

    // Check provenance
    if (!s.provenance) {
      warnings.push(`${s.id}: Missing provenance`)
    }
  })

  // 3. Category Distribution
  const categories: Record<string, number> = {}
  services.forEach(s => {
    categories[s.intent_category] = (categories[s.intent_category] || 0) + 1
  })

  console.log("\n📊 Category Distribution:")
  Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => console.log(`   ${cat}: ${count}`))

  // Check all expected categories have at least 1 service
  const expectedCategories = Object.values(IntentCategory)
  const missingCategories = expectedCategories.filter(c => !categories[c])
  if (missingCategories.length > 0) {
    errors.push(`Missing categories: ${missingCategories.join(", ")}`)
  }

  console.log("\n-------------------------------------------")
  if (errors.length > 0) {
    console.error(`❌ Audit FAILED with ${errors.length} errors and ${warnings.length} warnings.`)
    errors.forEach(e => console.error(`   ERR: ${e}`))
    warnings.forEach(w => console.warn(`   WARN: ${w}`))
    process.exit(1)
  } else {
    console.log(`✅ Audit PASSED with 0 errors and ${warnings.length} warnings.`)
    console.log(`Total Services Verified: ${services.length}`)
    if (warnings.length > 0) {
      warnings.slice(0, 5).forEach(w => console.warn(`   WARN: ${w}`))
      if (warnings.length > 5) console.warn(`   ... and ${warnings.length - 5} more warnings`)
    }
  }
}

runAudit().catch(err => {
  console.error(err)
  process.exit(1)
})

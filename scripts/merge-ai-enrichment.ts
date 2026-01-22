#!/usr/bin/env tsx
/**
 * AI Enrichment Merger
 *
 * Merges AI-generated enrichment data (hours, access_scripts, descriptions) into services.json
 *
 * Usage: npx tsx scripts/merge-ai-enrichment.ts <batch1.json> <batch2.json> <batch3.json> <batch4.json>
 */

import fs from "fs/promises"
import path from "path"

interface AIEnrichment {
  id: string
  hours?: {
    monday?: { open: string | null; close: string | null }
    tuesday?: { open: string | null; close: string | null }
    wednesday?: { open: string | null; close: string | null }
    thursday?: { open: string | null; close: string | null }
    friday?: { open: string | null; close: string | null }
    saturday?: { open: string | null; close: string | null }
    sunday?: { open: string | null; close: string | null }
    notes?: string
  }
  access_script?: string
  description_validation?: {
    current_ok: boolean
    suggested_improvement?: string
  }
}

interface Service {
  id: string
  name: string
  description?: string
  hours?: unknown
  access_script?: string
  [key: string]: unknown
}

async function loadServices(): Promise<Service[]> {
  const servicesPath = path.join(process.cwd(), "data", "services.json")
  const data = await fs.readFile(servicesPath, "utf-8")
  return JSON.parse(data)
}

async function saveServices(services: Service[]): Promise<void> {
  const servicesPath = path.join(process.cwd(), "data", "services.json")
  await fs.writeFile(servicesPath, JSON.stringify(services, null, 2) + "\n", "utf-8")
}

async function loadEnrichmentBatch(filepath: string): Promise<AIEnrichment[]> {
  const data = await fs.readFile(filepath, "utf-8")
  return JSON.parse(data)
}

function validateHours(hours: AIEnrichment["hours"]): boolean {
  if (!hours) return true

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
  for (const day of days) {
    const dayHours = hours[day as keyof typeof hours]
    if (!dayHours) continue

    if (typeof dayHours !== "object") return false
    if (!("open" in dayHours) || !("close" in dayHours)) return false

    // Validate time format if not null
    if (dayHours.open !== null && !/^\d{2}:\d{2}$/.test(dayHours.open)) return false
    if (dayHours.close !== null && !/^\d{2}:\d{2}$/.test(dayHours.close)) return false
  }

  return true
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error(
      "Usage: npx tsx scripts/merge-ai-enrichment.ts <batch1.json> [batch2.json] [batch3.json] [batch4.json]"
    )
    process.exit(1)
  }

  console.log("🤖 AI Enrichment Merger")
  console.log("═".repeat(60))
  console.log("")

  // Load all batches
  const allEnrichments: AIEnrichment[] = []
  for (const filepath of args) {
    console.log(`📥 Loading: ${filepath}`)
    const batch = await loadEnrichmentBatch(filepath)
    allEnrichments.push(...batch)
  }

  console.log(`✅ Loaded ${allEnrichments.length} enriched services`)
  console.log("")

  // Load current services
  const services = await loadServices()
  const serviceMap = new Map(services.map((s) => [s.id, s]))

  // Validate and merge
  let hoursAdded = 0
  let hoursUpdated = 0
  let accessScriptsAdded = 0
  let accessScriptsUpdated = 0
  let descriptionsImproved = 0
  const notFound: string[] = []
  const validationErrors: Array<{ id: string; error: string }> = []

  for (const enrichment of allEnrichments) {
    const service = serviceMap.get(enrichment.id)

    if (!service) {
      notFound.push(enrichment.id)
      continue
    }

    // Validate and merge hours
    if (enrichment.hours) {
      if (!validateHours(enrichment.hours)) {
        validationErrors.push({ id: enrichment.id, error: "Invalid hours format" })
        continue
      }

      if (!service.hours) {
        hoursAdded++
      } else {
        hoursUpdated++
      }
      service.hours = enrichment.hours
    }

    // Merge access_script
    if (enrichment.access_script) {
      if (!service.access_script) {
        accessScriptsAdded++
      } else {
        accessScriptsUpdated++
      }
      service.access_script = enrichment.access_script
    }

    // Apply description improvements
    if (enrichment.description_validation) {
      if (!enrichment.description_validation.current_ok && enrichment.description_validation.suggested_improvement) {
        console.log(`  📝 Improving description: ${service.name}`)
        console.log(`     Old: ${((service.description as string) || "").substring(0, 60)}...`)
        console.log(`     New: ${enrichment.description_validation.suggested_improvement.substring(0, 60)}...`)
        service.description = enrichment.description_validation.suggested_improvement
        descriptionsImproved++
      }
    }
  }

  // Save updated services
  await saveServices(services)

  console.log("═".repeat(60))
  console.log("")
  console.log("📊 Results:")
  console.log(`  Hours added: ${hoursAdded}`)
  console.log(`  Hours updated: ${hoursUpdated}`)
  console.log(`  Access scripts added: ${accessScriptsAdded}`)
  console.log(`  Access scripts updated: ${accessScriptsUpdated}`)
  console.log(`  Descriptions improved: ${descriptionsImproved}`)
  console.log("")

  if (notFound.length > 0) {
    console.log("⚠️  Services not found in data/services.json:")
    notFound.forEach((id) => console.log(`  - ${id}`))
    console.log("")
  }

  if (validationErrors.length > 0) {
    console.log("❌ Validation errors:")
    validationErrors.forEach(({ id, error }) => console.log(`  - ${id}: ${error}`))
    console.log("")
  }

  console.log("✅ Merge complete")
  console.log("")
  console.log("📌 Next steps:")
  console.log("  1. Review changes with: git diff data/services.json")
  console.log("  2. Run: npm run validate-data")
  console.log("  3. Run: npm run audit:data")
}

main().catch((error) => {
  console.error("Error merging enrichment:", error)
  process.exit(1)
})

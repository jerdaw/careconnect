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
    monday?: { open: string | null; close: string | null } | null
    tuesday?: { open: string | null; close: string | null } | null
    wednesday?: { open: string | null; close: string | null } | null
    thursday?: { open: string | null; close: string | null } | null
    friday?: { open: string | null; close: string | null } | null
    saturday?: { open: string | null; close: string | null } | null
    sunday?: { open: string | null; close: string | null } | null
    notes?: string | null
  }
  access_script?: string | null
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

function extractJsonFromText(text: string): string {
  try {
    JSON.parse(text)
    return text
  } catch {
    // fall through
  }

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fenceMatch?.[1]) {
    return fenceMatch[1]
  }

  const firstArray = text.indexOf("[")
  const lastArray = text.lastIndexOf("]")
  if (firstArray !== -1 && lastArray !== -1 && lastArray > firstArray) {
    return text.slice(firstArray, lastArray + 1)
  }

  const firstObj = text.indexOf("{")
  const lastObj = text.lastIndexOf("}")
  if (firstObj !== -1 && lastObj !== -1 && lastObj > firstObj) {
    return text.slice(firstObj, lastObj + 1)
  }

  return text
}

function coerceToEnrichmentArray(value: unknown): AIEnrichment[] {
  if (Array.isArray(value)) return value as AIEnrichment[]

  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>
    for (const key of ["data", "items", "services", "enrichments", "processed_batch_output"]) {
      if (Array.isArray(v[key])) return v[key] as AIEnrichment[]
    }
  }

  throw new Error("Expected enrichment JSON to be an array of objects")
}

async function loadEnrichmentBatch(filepath: string): Promise<AIEnrichment[]> {
  const raw = await fs.readFile(filepath, "utf-8")
  const jsonText = extractJsonFromText(raw)
  const parsed = JSON.parse(jsonText)
  return coerceToEnrichmentArray(parsed)
}

function normalizeTimeString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const match = value.trim().match(/^(\d{1,2}):([0-5]\d)$/)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  if (hour < 0 || hour > 23) return null
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

function sanitizeHours(hours: AIEnrichment["hours"]): AIEnrichment["hours"] | null {
  if (!hours || typeof hours !== "object") return null

  const result: NonNullable<AIEnrichment["hours"]> = {}
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const

  for (const day of days) {
    const dayHours = (hours as Record<string, unknown>)[day]
    if (!dayHours || typeof dayHours !== "object") continue

    const open = normalizeTimeString((dayHours as Record<string, unknown>).open)
    const close = normalizeTimeString((dayHours as Record<string, unknown>).close)
    if (!open || !close) continue

    result[day] = { open, close }
  }

  const notes = (hours as Record<string, unknown>).notes
  if (typeof notes === "string" && notes.trim()) {
    result.notes = notes.trim()
  }

  const hasAnyDay = days.some((d) => Boolean(result[d]))
  if (!hasAnyDay && !result.notes) return null

  return result
}

async function backupServicesFile(): Promise<string> {
  const servicesPath = path.join(process.cwd(), "data", "services.json")
  const backupsDir = path.join(process.cwd(), "data", "backups")
  await fs.mkdir(backupsDir, { recursive: true })
  const ts = new Date().toISOString().replace(/[:.]/g, "-")
  const backupPath = path.join(backupsDir, `services.${ts}.json`)
  await fs.copyFile(servicesPath, backupPath)
  return backupPath
}

async function main() {
  const rawArgs = process.argv.slice(2)
  const overwriteHours = rawArgs.includes("--overwrite-hours") || rawArgs.includes("--overwrite")
  const overwriteAccessScript = rawArgs.includes("--overwrite-access-script") || rawArgs.includes("--overwrite")
  const args = rawArgs.filter((a) => !a.startsWith("--"))

  if (args.length === 0) {
    console.error(
      "Usage: npx tsx scripts/merge-ai-enrichment.ts [--overwrite-hours] [--overwrite-access-script] <batch1.json> [batch2.json] ..."
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
  let hoursSkippedExisting = 0
  let accessScriptsAdded = 0
  let accessScriptsUpdated = 0
  let accessScriptsSkippedExisting = 0
  let descriptionsImproved = 0
  const notFound: string[] = []
  const validationErrors: Array<{ id: string; error: string }> = []
  let changed = false

  for (const enrichment of allEnrichments) {
    const service = serviceMap.get(enrichment.id)

    if (!service) {
      notFound.push(enrichment.id)
      continue
    }

    // Validate and merge hours
    if (enrichment.hours) {
      const sanitizedHours = sanitizeHours(enrichment.hours)
      if (!sanitizedHours) {
        validationErrors.push({ id: enrichment.id, error: "Invalid hours format" })
      } else if (!overwriteHours && service.hours) {
        hoursSkippedExisting++
      } else {
        if (!service.hours) {
          hoursAdded++
        } else {
          hoursUpdated++
        }
        service.hours = sanitizedHours
        changed = true
      }
    }

    // Merge access_script
    if (typeof enrichment.access_script === "string" && enrichment.access_script.trim()) {
      if (!overwriteAccessScript && service.access_script) {
        accessScriptsSkippedExisting++
      } else {
        if (!service.access_script) {
          accessScriptsAdded++
        } else {
          accessScriptsUpdated++
        }
        service.access_script = enrichment.access_script.trim()
        changed = true
      }
    }

    // Apply description improvements
    if (enrichment.description_validation) {
      if (!enrichment.description_validation.current_ok && enrichment.description_validation.suggested_improvement) {
        console.log(`  📝 Improving description: ${service.name}`)
        console.log(`     Old: ${((service.description as string) || "").substring(0, 60)}...`)
        console.log(`     New: ${enrichment.description_validation.suggested_improvement.substring(0, 60)}...`)
        service.description = enrichment.description_validation.suggested_improvement
        descriptionsImproved++
        changed = true
      }
    }
  }

  // Save updated services (with backup)
  if (changed) {
    const backupPath = await backupServicesFile()
    console.log(`🧷 Backup written: ${backupPath}`)
    await saveServices(services)
  } else {
    console.log("ℹ️  No changes to apply; skipping write")
  }

  console.log("═".repeat(60))
  console.log("")
  console.log("📊 Results:")
  console.log(`  Hours added: ${hoursAdded}`)
  console.log(`  Hours updated: ${hoursUpdated}`)
  console.log(`  Hours skipped (existing): ${hoursSkippedExisting}`)
  console.log(`  Access scripts added: ${accessScriptsAdded}`)
  console.log(`  Access scripts updated: ${accessScriptsUpdated}`)
  console.log(`  Access scripts skipped (existing): ${accessScriptsSkippedExisting}`)
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

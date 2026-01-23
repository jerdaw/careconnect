/**
 * Hours Gap Export
 *
 * Produces a machine-readable report for Phase 5 (Hours & Structured Data).
 *
 * Governance note: do not fabricate hours. This report is meant to drive targeted verification.
 *
 * Usage:
 *   node --import tsx scripts/export-hours-gaps.ts
 *   node --import tsx scripts/export-hours-gaps.ts --out docs/roadmaps/v17-5-hours/outputs/hours-gaps.json
 *   node --import tsx scripts/export-hours-gaps.ts --all --out docs/roadmaps/v17-5-hours/outputs/hours-gaps.all.json
 */

import fs from "fs/promises"
import path from "path"

interface Service {
  id: string
  name: string
  intent_category?: string
  scope?: string
  url?: string
  phone?: string
  email?: string
  address?: string
  status?: string
  published?: boolean
  deleted_at?: string | null
  virtual_delivery?: boolean
  hours?: Record<string, unknown>
  hours_text?: string
}

type HoursIssue = "missing_structured_hours" | "missing_hours_text"

interface HoursGapItem {
  id: string
  name: string
  intent_category: string | null
  scope: string | null
  status: string | null
  published: boolean | null
  virtual_delivery: boolean | null
  url: string | null
  phone: string | null
  email: string | null
  address: string | null
  has_structured_hours: boolean
  has_hours_text: boolean
  is_active: boolean
  issues: HoursIssue[]
}

interface HoursGapReport {
  generated_at: string
  emits_only_issues: boolean
  issues_breakdown: Record<HoursIssue, number>
  totals: {
    total_services: number
    active_services: number
    missing_structured_hours_any: number
    missing_structured_hours_active: number
    missing_hours_text_any: number
    missing_hours_text_active: number
  }
  items: HoursGapItem[]
}

function isActive(service: Service): boolean {
  if (service.deleted_at) return false
  if (service.published === false) return false
  if (service.status && service.status.toLowerCase().includes("permanently closed")) return false
  return true
}

function parseArgs(argv: string[]): { outPath: string | null; all: boolean } {
  const outIndex = argv.indexOf("--out")
  const outPath = outIndex >= 0 ? argv[outIndex + 1] : null
  if (outIndex >= 0 && (!outPath || outPath.startsWith("--"))) {
    throw new Error("Invalid --out value. Example: --out docs/roadmaps/v17-5-hours/outputs/hours-gaps.json")
  }
  const all = argv.includes("--all")
  return { outPath, all }
}

async function loadServices(): Promise<Service[]> {
  const servicesPath = path.join(process.cwd(), "data", "services.json")
  const data = await fs.readFile(servicesPath, "utf-8")
  return JSON.parse(data)
}

async function main() {
  const { outPath, all } = parseArgs(process.argv.slice(2))

  const services = await loadServices()

  let activeServices = 0
  let missingStructuredAny = 0
  let missingStructuredActive = 0
  let missingHoursTextAny = 0
  let missingHoursTextActive = 0

  const issuesBreakdown: Record<HoursIssue, number> = {
    missing_structured_hours: 0,
    missing_hours_text: 0,
  }

  const itemsAll: HoursGapItem[] = services.map((service) => {
    const active = isActive(service)
    if (active) activeServices++

    const hasStructuredHours = !!service.hours
    const hasHoursText = !!(service.hours_text && service.hours_text.trim().length > 0)

    if (!hasStructuredHours) {
      missingStructuredAny++
      if (active) missingStructuredActive++
    }
    if (!hasHoursText) {
      missingHoursTextAny++
      if (active) missingHoursTextActive++
    }

    const issues: HoursIssue[] = []
    if (!hasStructuredHours) {
      issues.push("missing_structured_hours")
      issuesBreakdown.missing_structured_hours++
    }
    if (!hasHoursText) {
      issues.push("missing_hours_text")
      issuesBreakdown.missing_hours_text++
    }

    return {
      id: service.id,
      name: service.name,
      intent_category: service.intent_category ?? null,
      scope: service.scope ?? null,
      status: service.status ?? null,
      published: service.published ?? null,
      virtual_delivery: service.virtual_delivery ?? null,
      url: service.url ?? null,
      phone: service.phone ?? null,
      email: service.email ?? null,
      address: service.address ?? null,
      has_structured_hours: hasStructuredHours,
      has_hours_text: hasHoursText,
      is_active: active,
      issues,
    }
  })

  const items = all ? itemsAll : itemsAll.filter((item) => item.issues.length > 0)

  const report: HoursGapReport = {
    generated_at: new Date().toISOString(),
    emits_only_issues: !all,
    issues_breakdown: issuesBreakdown,
    totals: {
      total_services: services.length,
      active_services: activeServices,
      missing_structured_hours_any: missingStructuredAny,
      missing_structured_hours_active: missingStructuredActive,
      missing_hours_text_any: missingHoursTextAny,
      missing_hours_text_active: missingHoursTextActive,
    },
    items,
  }

  const output = JSON.stringify(report, null, 2) + "\n"

  if (outPath) {
    const absOut = path.isAbsolute(outPath) ? outPath : path.join(process.cwd(), outPath)
    await fs.mkdir(path.dirname(absOut), { recursive: true })
    await fs.writeFile(absOut, output, "utf-8")
    console.log(`✅ Wrote hours gap report: ${outPath}`)
    return
  }

  process.stdout.write(output)
}

main().catch((error) => {
  console.error("Error exporting hours gaps:", error)
  process.exit(1)
})

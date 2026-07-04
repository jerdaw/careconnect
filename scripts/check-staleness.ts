#!/usr/bin/env npx tsx
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"

import type { Service } from "../types/service"

const DATA_PATH = path.join(process.cwd(), "data/services.json")
const MS_PER_DAY = 1000 * 60 * 60 * 24

export const THRESHOLDS = {
  CRISIS: 30,
  GENERAL: 90,
  STALE: 180,
} as const

export type StalenessStatus = "fresh" | "due" | "stale" | "unknown"
export type SearchVisibility = "visible_current" | "visible_due_for_reverification" | "hidden_pending_reverification"

export interface StalenessResult {
  service: Service
  lastVerified: Date | null
  daysSinceVerification: number | null
  status: StalenessStatus
  recommendation: string
}

export interface StalenessReportRow {
  service_id: string
  name: string
  category: string
  verification_level: string
  last_verified: string | null
  cadence_days: number
  days_since_verification: number | null
  status: StalenessStatus
  search_visibility: SearchVisibility
  priority_lane: string
  recommendation: string
  reviewer: string
  evidence_url: string
  notes: string
}

export interface StalenessSummary {
  total: number
  fresh: number
  due: number
  stale: number
  unknown: number
  visible_within_180_day_window: number
  hidden_pending_reverification: number
}

export interface StalenessReport {
  generated_at: string
  as_of: string
  thresholds_days: {
    crisis: number
    general: number
    stale: number
  }
  summary: StalenessSummary
  category_counts: Record<string, StalenessSummary>
  services: StalenessReportRow[]
}

interface BuildStalenessReportOptions {
  asOf?: Date
  generatedAt?: string
}

interface CheckStalenessOptions extends BuildStalenessReportOptions {
  dataPath?: string
}

interface CliOptions {
  asOf?: Date
  dataPath: string
  outDir?: string
  help: boolean
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf-8")) as T
}

function datePart(date: Date): string {
  return date.toISOString().split("T")[0] ?? date.toISOString()
}

function getVerificationDate(service: Service): Date | null {
  const dateStr = service.provenance?.verified_at || service.last_verified
  if (!dateStr) return null

  const date = new Date(dateStr)
  return Number.isNaN(date.getTime()) ? null : date
}

function getDaysSince(date: Date | null, asOf: Date): number | null {
  if (!date) return null
  return Math.floor((asOf.getTime() - date.getTime()) / MS_PER_DAY)
}

function getCadenceDays(service: Service): number {
  return service.intent_category === "Crisis" ? THRESHOLDS.CRISIS : THRESHOLDS.GENERAL
}

function getStatus(daysSince: number | null, cadenceDays: number): StalenessStatus {
  if (daysSince === null) return "unknown"
  if (daysSince >= THRESHOLDS.STALE) return "stale"
  if (daysSince >= cadenceDays) return "due"
  return "fresh"
}

function getSearchVisibility(status: StalenessStatus): SearchVisibility {
  if (status === "fresh") return "visible_current"
  if (status === "due") return "visible_due_for_reverification"
  return "hidden_pending_reverification"
}

function getPriorityLane(service: Service, status: StalenessStatus): string {
  if (status === "stale" && service.intent_category === "Crisis") return "1 - crisis stale"
  if (status === "due" && service.intent_category === "Crisis") return "2 - crisis due"
  if (status === "stale") return "3 - stale"
  if (status === "unknown") return "4 - unknown verification date"
  if (status === "due") return "5 - due"
  return "6 - fresh"
}

function getPrioritySortWeight(priorityLane: string): number {
  const parsed = Number(priorityLane.split(" - ")[0])
  return Number.isFinite(parsed) ? parsed : 99
}

function getRecommendation(status: StalenessStatus, daysSince: number | null, asOfLabel: string): string {
  if (status === "unknown") return "Add a verification date after manual evidence is recorded."
  if (status === "stale") {
    const age = daysSince === null ? "unknown age" : `${daysSince} days old`
    return `Reverify before restoring current-date search visibility; update service facts and provenance only after evidence is recorded (${age}).`
  }
  if (status === "due") {
    return `Reverify soon; still inside the 180-day visibility window as of ${asOfLabel} (${daysSince} days since verification).`
  }
  return `No immediate action (${daysSince} days since verification).`
}

function emptySummary(): StalenessSummary {
  return {
    total: 0,
    fresh: 0,
    due: 0,
    stale: 0,
    unknown: 0,
    visible_within_180_day_window: 0,
    hidden_pending_reverification: 0,
  }
}

function incrementSummary(summary: StalenessSummary, status: StalenessStatus): void {
  summary.total += 1
  summary[status] += 1

  if (status === "fresh" || status === "due") {
    summary.visible_within_180_day_window += 1
  } else {
    summary.hidden_pending_reverification += 1
  }
}

export function buildStalenessReport(
  services: Service[],
  { asOf = new Date(), generatedAt = new Date().toISOString() }: BuildStalenessReportOptions = {}
): StalenessReport {
  const asOfLabel = datePart(asOf)
  const summary = emptySummary()
  const categoryCounts: Record<string, StalenessSummary> = {}

  const rows = services.map((service) => {
    const lastVerified = getVerificationDate(service)
    const daysSince = getDaysSince(lastVerified, asOf)
    const cadenceDays = getCadenceDays(service)
    const status = getStatus(daysSince, cadenceDays)
    const category = service.intent_category || "Uncategorized"
    const priorityLane = getPriorityLane(service, status)

    incrementSummary(summary, status)
    categoryCounts[category] ??= emptySummary()
    incrementSummary(categoryCounts[category], status)

    return {
      service_id: service.id,
      name: service.name,
      category,
      verification_level: service.verification_level,
      last_verified: lastVerified ? datePart(lastVerified) : null,
      cadence_days: cadenceDays,
      days_since_verification: daysSince,
      status,
      search_visibility: getSearchVisibility(status),
      priority_lane: priorityLane,
      recommendation: getRecommendation(status, daysSince, asOfLabel),
      reviewer: "",
      evidence_url: "",
      notes: "",
    } satisfies StalenessReportRow
  })

  return {
    generated_at: generatedAt,
    as_of: asOfLabel,
    thresholds_days: {
      crisis: THRESHOLDS.CRISIS,
      general: THRESHOLDS.GENERAL,
      stale: THRESHOLDS.STALE,
    },
    summary,
    category_counts: Object.fromEntries(Object.entries(categoryCounts).sort(([a], [b]) => a.localeCompare(b))),
    services: rows.sort((a, b) => {
      const priorityDelta = getPrioritySortWeight(a.priority_lane) - getPrioritySortWeight(b.priority_lane)
      if (priorityDelta !== 0) return priorityDelta

      const ageDelta = (b.days_since_verification ?? -1) - (a.days_since_verification ?? -1)
      if (ageDelta !== 0) return ageDelta

      const categoryDelta = a.category.localeCompare(b.category)
      if (categoryDelta !== 0) return categoryDelta

      return a.service_id.localeCompare(b.service_id)
    }),
  }
}

export function checkStaleness(options: CheckStalenessOptions = {}): StalenessReport {
  const services = readJson<Service[]>(options.dataPath ?? DATA_PATH)
  return buildStalenessReport(services, options)
}

export function renderStalenessMarkdown(report: StalenessReport): string {
  const categoryRows = Object.entries(report.category_counts).map(
    ([category, counts]) =>
      `| ${category} | ${counts.total} | ${counts.fresh} | ${counts.due} | ${counts.stale} | ${counts.unknown} |`
  )
  const urgentRows = report.services
    .filter((service) => service.status === "stale" || service.status === "unknown")
    .slice(0, 25)
    .map(
      (service) =>
        `| ${service.priority_lane} | \`${service.service_id}\` | ${service.name} | ${service.category} | ${service.last_verified ?? "unknown"} | ${service.days_since_verification ?? "unknown"} |`
    )

  return [
    "# Service Freshness Audit",
    "",
    `- Generated: ${report.generated_at}`,
    `- As of: ${report.as_of}`,
    `- Source: data/services.json`,
    `- No service facts, verification dates, or provenance were updated by this audit.`,
    "",
    "## Summary",
    "",
    `- Total services: ${report.summary.total}`,
    `- Fresh: ${report.summary.fresh}`,
    `- Due for reverification: ${report.summary.due}`,
    `- Stale over 180 days: ${report.summary.stale}`,
    `- Unknown verification date: ${report.summary.unknown}`,
    `- Visible within 180-day window: ${report.summary.visible_within_180_day_window}`,
    `- Hidden pending reverification: ${report.summary.hidden_pending_reverification}`,
    "",
    "## Governance Boundary",
    "",
    "Services marked stale or unknown should be reverified before they are treated as current for live search. Update `data/services.json`, verification dates, and provenance only after manual evidence is recorded.",
    "",
    "## Category Counts",
    "",
    "| Category | Total | Fresh | Due | Stale | Unknown |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
    ...categoryRows,
    "",
    "## Immediate Queue",
    "",
    urgentRows.length > 0
      ? "| Priority | Service ID | Service | Category | Last verified | Age days |\n| --- | --- | --- | --- | --- | ---: |\n" +
        urgentRows.join("\n")
      : "No stale or unknown records found.",
    "",
    "Use `verification-worksheet.csv` for the full queue, including due-but-visible services.",
  ].join("\n")
}

function csvEscape(value: string | number | null): string {
  if (value === null) return ""
  const rawText = String(value)
  const text = /^[=+\-@\t\r]|^\s+[=+\-@]/.test(rawText) ? `'${rawText}` : rawText
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

export function renderStalenessCsv(report: StalenessReport): string {
  const header = [
    "service_id",
    "name",
    "category",
    "verification_level",
    "last_verified",
    "cadence_days",
    "days_since_verification",
    "status",
    "search_visibility",
    "priority_lane",
    "recommendation",
    "reviewer",
    "evidence_url",
    "notes",
  ]

  const rows = report.services.map((service) =>
    [
      service.service_id,
      service.name,
      service.category,
      service.verification_level,
      service.last_verified,
      service.cadence_days,
      service.days_since_verification,
      service.status,
      service.search_visibility,
      service.priority_lane,
      service.recommendation,
      service.reviewer,
      service.evidence_url,
      service.notes,
    ]
      .map(csvEscape)
      .join(",")
  )

  return [header.join(","), ...rows].join("\n")
}

export function writeStalenessArtifacts(report: StalenessReport, outDir: string): string[] {
  mkdirSync(outDir, { recursive: true })

  const artifacts = [
    {
      path: path.join(outDir, "staleness-report.json"),
      contents: JSON.stringify(report, null, 2),
    },
    {
      path: path.join(outDir, "staleness-summary.md"),
      contents: renderStalenessMarkdown(report),
    },
    {
      path: path.join(outDir, "verification-worksheet.csv"),
      contents: renderStalenessCsv(report),
    },
  ]

  for (const artifact of artifacts) {
    writeFileSync(artifact.path, `${artifact.contents}\n`, "utf-8")
  }

  return artifacts.map((artifact) => artifact.path)
}

function printResults(report: StalenessReport): void {
  console.log("📅 Checking service staleness...")
  console.log(`   Thresholds: Crisis=${THRESHOLDS.CRISIS}d, General=${THRESHOLDS.GENERAL}d, Stale=${THRESHOLDS.STALE}d`)
  console.log(`   As of: ${report.as_of}\n`)

  console.log("📊 Staleness Report:")
  console.log(`   Total services: ${report.summary.total}`)
  console.log(`   ✅ Fresh: ${report.summary.fresh}`)
  console.log(`   ⏰ Due for verification: ${report.summary.due}`)
  console.log(`   🔴 STALE (>6 months): ${report.summary.stale}`)
  console.log(`   ❓ Unknown (no date): ${report.summary.unknown}`)
  console.log(`   Visible within 180-day window: ${report.summary.visible_within_180_day_window}`)
  console.log(`   Hidden pending reverification: ${report.summary.hidden_pending_reverification}`)

  const stale = report.services.filter((service) => service.status === "stale")
  const due = report.services.filter((service) => service.status === "due")
  const unknown = report.services.filter((service) => service.status === "unknown")

  if (stale.length > 0) {
    console.log("\n🔴 STALE SERVICES (reverify before restoring current search visibility):\n")
    for (const service of stale) {
      console.log(`   ${service.service_id}`)
      console.log(`      Name: ${service.name}`)
      console.log(`      Category: ${service.category}`)
      console.log(`      Last verified: ${service.last_verified ?? "never"}`)
      console.log(`      Days since: ${service.days_since_verification}`)
      console.log(`      Action: ${service.recommendation}`)
      console.log()
    }
  }

  if (due.length > 0) {
    console.log("\n⏰ SERVICES DUE FOR VERIFICATION:\n")
    for (const service of due) {
      console.log(`   - ${service.service_id} (${service.category}): ${service.days_since_verification} days`)
    }
  }

  if (unknown.length > 0) {
    console.log("\n❓ SERVICES WITH NO VERIFICATION DATE:\n")
    for (const [index, service] of unknown.entries()) {
      if (unknown.length > 10 && index === 5) {
        console.log(`   ... and ${unknown.length - 5} more`)
        break
      }
      console.log(`   - ${service.service_id}`)
    }
  }

  if (process.env.GITHUB_OUTPUT) {
    try {
      appendFileSync(process.env.GITHUB_OUTPUT, `stale_count=${report.summary.stale}\n`)
      appendFileSync(process.env.GITHUB_OUTPUT, `due_count=${report.summary.due}\n`)
      const staleIds = stale.map((service) => service.service_id).join(",")
      appendFileSync(process.env.GITHUB_OUTPUT, `stale_ids=${staleIds}\n`)
    } catch {
      // Ignore non-writable GitHub output paths so local audits stay non-blocking.
    }
  }
}

function parseAsOf(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("--as-of must use YYYY-MM-DD format")
  }

  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || datePart(parsed) !== value) {
    throw new Error("--as-of must be a valid calendar date")
  }

  return parsed
}

function getRequiredArg(args: string[], index: number, name: string): string {
  const value = args[index + 1]
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`)
  }
  return value
}

function parseCliArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    dataPath: DATA_PATH,
    help: false,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === "--help" || arg === "-h") {
      options.help = true
    } else if (arg === "--as-of") {
      options.asOf = parseAsOf(getRequiredArg(args, index, arg))
      index += 1
    } else if (arg === "--out-dir") {
      options.outDir = getRequiredArg(args, index, arg)
      index += 1
    } else if (arg === "--data") {
      options.dataPath = getRequiredArg(args, index, arg)
      index += 1
    } else {
      throw new Error(`Unknown argument: ${arg ?? ""}`)
    }
  }

  return options
}

function printUsage(): void {
  console.log("Usage: node --import tsx scripts/check-staleness.ts [--as-of YYYY-MM-DD] [--out-dir <dir>]")
  console.log("       node --import tsx scripts/check-staleness.ts [--data <path>] [--as-of YYYY-MM-DD]")
}

function main(): void {
  try {
    const options = parseCliArgs(process.argv.slice(2))
    if (options.help) {
      printUsage()
      return
    }

    const report = checkStaleness({ dataPath: options.dataPath, asOf: options.asOf })
    printResults(report)

    if (options.outDir) {
      const artifacts = writeStalenessArtifacts(report, options.outDir)
      console.log("\nWrote staleness audit artifacts:")
      for (const artifact of artifacts) {
        console.log(`   - ${artifact}`)
      }
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}

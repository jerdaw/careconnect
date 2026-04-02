import { createClient } from "@supabase/supabase-js"
import fs from "fs/promises"
import type { Service } from "@/types/service"
import type { PilotScopeSlaTier } from "@/types/pilot-instrumentation"
import type { Database } from "@/types/supabase"

export interface PilotScopeEntry {
  service_id: string
  sla_tier: PilotScopeSlaTier
  org_id?: string
  pilot_cycle_id?: string
}

export interface PilotReadinessServiceRow {
  service_id: string
  name: string
  category: string
  verification_level: string
  last_verified: string | null
  sla_tier: PilotScopeSlaTier
  missing_required_coordinates: boolean
  missing_address_for_required_coordinates: boolean
  missing_email: boolean
  missing_hours: boolean
  missing_hours_text: boolean
  missing_access_script: boolean
  verification_status: "missing" | "fresh" | "due" | "stale"
  verification_action: string
  follow_up_date: string
  reviewer: string
  notes: string
}

export interface PilotReadinessReport {
  generated_at: string
  total_scoped_services: number
  matched_services: number
  missing_service_records: string[]
  verification_level_distribution: Record<string, number>
  sla_tier_distribution: Record<PilotScopeSlaTier, number>
  gap_counts: {
    missing_required_coordinates: number
    missing_address_for_required_coordinates: number
    missing_email: number
    missing_hours: number
    missing_hours_text: number
    missing_access_script: number
    verification_missing: number
    verification_due: number
    verification_stale: number
  }
  services: PilotReadinessServiceRow[]
}

interface ScopeFilePayload {
  services?: PilotScopeEntry[]
}

const STALENESS_THRESHOLDS = {
  crisis: 30,
  general: 90,
  stale: 180,
} as const

function isActive(service: Service): boolean {
  if (service.deleted_at) return false
  if (service.published === false) return false
  if (service.status?.toLowerCase().includes("permanently closed")) return false
  return true
}

function hasCoordinates(service: Service): boolean {
  const legacyCoordinates = service as Service & { latitude?: number; longitude?: number }
  return Boolean(service.coordinates || (legacyCoordinates.latitude && legacyCoordinates.longitude))
}

function requiresCoordinates(service: Service): boolean {
  if (!isActive(service)) return false
  if (service.scope !== "kingston") return false
  if (service.virtual_delivery === true) return false
  return true
}

function getVerificationDate(service: Service): Date | null {
  const dateStr = service.provenance?.verified_at || service.last_verified
  if (!dateStr) return null
  const parsed = new Date(dateStr)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function getVerificationStatus(service: Service): "missing" | "fresh" | "due" | "stale" {
  const verifiedAt = getVerificationDate(service)
  if (!verifiedAt) return "missing"

  const daysSince = Math.floor((Date.now() - verifiedAt.getTime()) / (1000 * 60 * 60 * 24))
  if (daysSince >= STALENESS_THRESHOLDS.stale) return "stale"

  const threshold = service.intent_category === "Crisis" ? STALENESS_THRESHOLDS.crisis : STALENESS_THRESHOLDS.general
  if (daysSince >= threshold) return "due"
  return "fresh"
}

export async function loadPilotScopeEntriesFromFile(filePath: string): Promise<PilotScopeEntry[]> {
  const raw = await fs.readFile(filePath, "utf-8")
  const parsed = JSON.parse(raw) as PilotScopeEntry[] | ScopeFilePayload

  if (Array.isArray(parsed)) {
    return parsed
  }

  return parsed.services ?? []
}

export async function loadPilotScopeEntriesFromSupabase(options: {
  supabaseUrl: string
  supabaseKey: string
  pilotCycleId: string
  orgId?: string
}): Promise<PilotScopeEntry[]> {
  const supabase = createClient<Database>(options.supabaseUrl, options.supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  let query = supabase
    .from("pilot_service_scope")
    .select("pilot_cycle_id, org_id, service_id, sla_tier")
    .eq("pilot_cycle_id", options.pilotCycleId)

  if (options.orgId) {
    query = query.eq("org_id", options.orgId)
  }

  const { data, error } = await query.order("service_id", { ascending: true })
  if (error) {
    throw new Error(`Failed to load pilot scope: ${error.message}`)
  }

  return (data ?? []) as PilotScopeEntry[]
}

export function buildPilotReadinessReport(services: Service[], scopeEntries: PilotScopeEntry[]): PilotReadinessReport {
  const serviceMap = new Map(services.map((service) => [service.id, service]))
  const matchedRows: PilotReadinessServiceRow[] = []
  const missingServiceRecords: string[] = []

  const verificationLevelDistribution: Record<string, number> = {}
  const slaTierDistribution: Record<PilotScopeSlaTier, number> = {
    crisis: 0,
    high_demand: 0,
    standard: 0,
  }

  const gapCounts: PilotReadinessReport["gap_counts"] = {
    missing_required_coordinates: 0,
    missing_address_for_required_coordinates: 0,
    missing_email: 0,
    missing_hours: 0,
    missing_hours_text: 0,
    missing_access_script: 0,
    verification_missing: 0,
    verification_due: 0,
    verification_stale: 0,
  }

  for (const entry of scopeEntries) {
    slaTierDistribution[entry.sla_tier] += 1
    const service = serviceMap.get(entry.service_id)
    if (!service) {
      missingServiceRecords.push(entry.service_id)
      continue
    }

    verificationLevelDistribution[service.verification_level] =
      (verificationLevelDistribution[service.verification_level] ?? 0) + 1

    const missingRequiredCoordinates = requiresCoordinates(service) && !hasCoordinates(service)
    const missingAddressForRequiredCoordinates =
      missingRequiredCoordinates && (!service.address || service.address.trim().length === 0)
    const verificationStatus = getVerificationStatus(service)

    gapCounts.missing_required_coordinates += Number(missingRequiredCoordinates)
    gapCounts.missing_address_for_required_coordinates += Number(missingAddressForRequiredCoordinates)
    gapCounts.missing_email += Number(!service.email)
    gapCounts.missing_hours += Number(!service.hours)
    gapCounts.missing_hours_text += Number(!service.hours_text)
    gapCounts.missing_access_script += Number(!service.access_script)
    gapCounts.verification_missing += Number(verificationStatus === "missing")
    gapCounts.verification_due += Number(verificationStatus === "due")
    gapCounts.verification_stale += Number(verificationStatus === "stale")

    matchedRows.push({
      service_id: service.id,
      name: service.name,
      category: service.intent_category,
      verification_level: service.verification_level,
      last_verified: service.provenance?.verified_at || service.last_verified || null,
      sla_tier: entry.sla_tier,
      missing_required_coordinates: missingRequiredCoordinates,
      missing_address_for_required_coordinates: missingAddressForRequiredCoordinates,
      missing_email: !service.email,
      missing_hours: !service.hours,
      missing_hours_text: !service.hours_text,
      missing_access_script: !service.access_script,
      verification_status: verificationStatus,
      verification_action: "",
      follow_up_date: "",
      reviewer: "",
      notes: "",
    })
  }

  return {
    generated_at: new Date().toISOString(),
    total_scoped_services: scopeEntries.length,
    matched_services: matchedRows.length,
    missing_service_records: missingServiceRecords,
    verification_level_distribution: verificationLevelDistribution,
    sla_tier_distribution: slaTierDistribution,
    gap_counts: gapCounts,
    services: matchedRows.sort((a, b) => a.service_id.localeCompare(b.service_id)),
  }
}

export function renderPilotReadinessMarkdown(report: PilotReadinessReport): string {
  return [
    "# Pilot Readiness Audit",
    "",
    `- Generated: ${report.generated_at}`,
    `- Scoped services: ${report.total_scoped_services}`,
    `- Matched local service records: ${report.matched_services}`,
    `- Missing local service records: ${report.missing_service_records.length}`,
    "",
    "## Gap Summary",
    "",
    `- Missing required coordinates: ${report.gap_counts.missing_required_coordinates}`,
    `- Missing address for required coordinates: ${report.gap_counts.missing_address_for_required_coordinates}`,
    `- Missing email: ${report.gap_counts.missing_email}`,
    `- Missing structured hours: ${report.gap_counts.missing_hours}`,
    `- Missing hours text: ${report.gap_counts.missing_hours_text}`,
    `- Missing access script: ${report.gap_counts.missing_access_script}`,
    `- Verification missing: ${report.gap_counts.verification_missing}`,
    `- Verification due: ${report.gap_counts.verification_due}`,
    `- Verification stale: ${report.gap_counts.verification_stale}`,
    "",
    "## SLA Tier Distribution",
    "",
    `- crisis: ${report.sla_tier_distribution.crisis}`,
    `- high_demand: ${report.sla_tier_distribution.high_demand}`,
    `- standard: ${report.sla_tier_distribution.standard}`,
    "",
    "## Verification Level Distribution",
    "",
    ...Object.entries(report.verification_level_distribution)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([level, count]) => `- ${level}: ${count}`),
  ].join("\n")
}

function csvEscape(value: string | boolean | null): string {
  if (value === null) return ""
  const text = String(value)
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

export function renderPilotReadinessCsv(report: PilotReadinessReport): string {
  const header = [
    "service_id",
    "name",
    "category",
    "verification_level",
    "last_verified",
    "sla_tier",
    "missing_required_coordinates",
    "missing_address_for_required_coordinates",
    "missing_email",
    "missing_hours",
    "missing_hours_text",
    "missing_access_script",
    "verification_status",
    "verification_action",
    "follow_up_date",
    "reviewer",
    "notes",
  ]

  const rows = report.services.map((service) =>
    [
      service.service_id,
      service.name,
      service.category,
      service.verification_level,
      service.last_verified,
      service.sla_tier,
      service.missing_required_coordinates,
      service.missing_address_for_required_coordinates,
      service.missing_email,
      service.missing_hours,
      service.missing_hours_text,
      service.missing_access_script,
      service.verification_status,
      service.verification_action,
      service.follow_up_date,
      service.reviewer,
      service.notes,
    ]
      .map(csvEscape)
      .join(",")
  )

  return [header.join(","), ...rows].join("\n")
}

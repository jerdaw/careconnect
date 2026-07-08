import { mapServiceToDatabaseUpsert } from "../../lib/service-db"
import type { Service, ServiceCoverageArea } from "../../types/service"

export const APPROVED_BRAMPTON_SERVICE_IDS = [
  "brampton-peel-centralized-shelter-intake",
  "brampton-wilkinson-road-shelter",
  "brampton-victim-services-of-peel",
  "brampton-safe-centre-of-peel",
  "brampton-peel-ontario-works-emergency-assistance",
  "brampton-regeneration-marketplace-food-bank",
  "brampton-knights-table-food-bank-meals",
  "brampton-ste-louise-food-bank",
] as const

export const BRAMPTON_SYNC_APPROVAL_TOKEN = "I_APPROVE_SYNCING_APPROVED_BRAMPTON_RECORDS"

export type BramptonSyncMode = "dry-run" | "apply"

export type BramptonProductionSyncPlan = {
  ids: string[]
  rows: ReturnType<typeof mapServiceToDatabaseUpsert>[]
  summary: {
    expectedIds: number
    selectedServices: number
    rowsWithBramptonCoverage: number
    rowsWithEmbeddings: number
  }
}

export function parseBramptonSyncArgs(args: string[]): { mode: BramptonSyncMode } {
  for (const arg of args) {
    if (arg !== "--dry-run" && arg !== "--apply") {
      throw new Error(`Unsupported argument: ${arg}`)
    }
  }

  const dryRunCount = args.filter((arg) => arg === "--dry-run").length
  const applyCount = args.filter((arg) => arg === "--apply").length
  const modeCount = dryRunCount + applyCount

  if (modeCount === 0) {
    return { mode: "dry-run" }
  }

  if (modeCount !== 1) {
    throw new Error("Use exactly one mode: --dry-run or --apply")
  }

  return { mode: applyCount === 1 ? "apply" : "dry-run" }
}

export function assertBramptonSyncApplyApproval(value: string | undefined): void {
  if (value !== BRAMPTON_SYNC_APPROVAL_TOKEN) {
    throw new Error(`BRAMPTON_SYNC_APPROVAL must equal ${BRAMPTON_SYNC_APPROVAL_TOKEN} before --apply can write`)
  }
}

export function isUsableSupabaseSecretKey(value: string | undefined): boolean {
  if (!value) return false

  const normalized = value.trim().toLowerCase()
  if (!normalized || normalized.includes("your-") || normalized.includes("replace-me")) {
    return false
  }

  return value.trim().length >= 40
}

export function buildBramptonProductionSyncPlan(input: {
  services: Service[]
  embeddings: Record<string, number[]>
}): BramptonProductionSyncPlan {
  const selectedServices = APPROVED_BRAMPTON_SERVICE_IDS.map((id) => {
    const service = input.services.find((candidate) => candidate.id === id)
    if (!service) {
      throw new Error(`Missing approved Brampton service: ${id}`)
    }
    return service
  })

  if (selectedServices.length !== APPROVED_BRAMPTON_SERVICE_IDS.length) {
    throw new Error(
      `Expected ${APPROVED_BRAMPTON_SERVICE_IDS.length} approved Brampton services; found ${selectedServices.length}`
    )
  }

  const rows = selectedServices.map((service) => {
    if (!hasBramptonCoverage(service)) {
      throw new Error(`Approved Brampton service lacks Brampton coverage: ${service.id}`)
    }

    const embedding = input.embeddings[service.id]
    if (!isEmbeddingVector(embedding)) {
      throw new Error(`Missing 384-dimensional embedding for approved Brampton service: ${service.id}`)
    }

    return {
      ...mapServiceToDatabaseUpsert({ ...service, embedding }),
      scope: null,
    }
  })

  return {
    ids: [...APPROVED_BRAMPTON_SERVICE_IDS],
    rows,
    summary: {
      expectedIds: APPROVED_BRAMPTON_SERVICE_IDS.length,
      selectedServices: selectedServices.length,
      rowsWithBramptonCoverage: selectedServices.filter(hasBramptonCoverage).length,
      rowsWithEmbeddings: rows.filter((row) => isEmbeddingVector(row.embedding)).length,
    },
  }
}

function hasBramptonCoverage(service: Service): boolean {
  return (
    service.primary_place_id === "brampton-on" ||
    (service.coverage ?? []).some((area: ServiceCoverageArea) => area.placeIds?.includes("brampton-on"))
  )
}

function isEmbeddingVector(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === 384 && value.every((item) => typeof item === "number")
}

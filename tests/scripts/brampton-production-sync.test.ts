/** @vitest-environment node */
import { describe, expect, it } from "vitest"

import embeddingsRaw from "@/data/embeddings.json"
import servicesRaw from "@/data/services.json"
import {
  APPROVED_BRAMPTON_SERVICE_IDS,
  BRAMPTON_SYNC_APPROVAL_TOKEN,
  assertBramptonSyncApplyApproval,
  buildBramptonProductionSyncPlan,
  isUsableSupabaseSecretKey,
  parseBramptonSyncArgs,
} from "@/scripts/lib/brampton-production-sync"
import type { Service, ServiceCoverageArea } from "@/types/service"

const services = servicesRaw as Service[]
const embeddings = embeddingsRaw as Record<string, number[]>

function hasBramptonCoverage(service: Service): boolean {
  return (
    service.primary_place_id === "brampton-on" ||
    (service.coverage ?? []).some((area: ServiceCoverageArea) => area.placeIds?.includes("brampton-on"))
  )
}

function serviceById(id: string): Service {
  const service = services.find((candidate) => candidate.id === id)
  if (!service) {
    throw new Error(`Fixture service not found: ${id}`)
  }
  return service
}

describe("Brampton production sync planner", () => {
  it("pins the exact approved Brampton launch records", () => {
    expect(APPROVED_BRAMPTON_SERVICE_IDS).toEqual([
      "brampton-peel-centralized-shelter-intake",
      "brampton-wilkinson-road-shelter",
      "brampton-victim-services-of-peel",
      "brampton-safe-centre-of-peel",
      "brampton-peel-ontario-works-emergency-assistance",
      "brampton-regeneration-marketplace-food-bank",
      "brampton-knights-table-food-bank-meals",
      "brampton-ste-louise-food-bank",
    ])
    expect(new Set(APPROVED_BRAMPTON_SERVICE_IDS).size).toBe(8)
  })

  it("selects only the approved Brampton services and maps embeddings for upsert", () => {
    const plan = buildBramptonProductionSyncPlan({ services, embeddings })

    expect(plan.ids).toEqual([...APPROVED_BRAMPTON_SERVICE_IDS])
    expect(plan.rows.map((row) => row.id)).toEqual([...APPROVED_BRAMPTON_SERVICE_IDS])
    expect(plan.summary).toEqual({
      expectedIds: 8,
      selectedServices: 8,
      rowsWithBramptonCoverage: 8,
      rowsWithEmbeddings: 8,
    })

    for (const id of plan.ids) {
      const service = serviceById(id)
      const row = plan.rows.find((candidate) => candidate.id === id)

      expect(hasBramptonCoverage(service)).toBe(true)
      expect(row?.scope).toBeNull()
      expect(row?.primary_place_id).toBe("brampton-on")
      expect(row?.coverage).toEqual(service.coverage)
      expect(Array.isArray(row?.embedding)).toBe(true)
      expect((row?.embedding as number[] | undefined)?.length).toBe(384)
    }
  })

  it("does not select Kingston-only services", () => {
    const plan = buildBramptonProductionSyncPlan({ services, embeddings })
    const selectedServices = plan.ids.map(serviceById)

    expect(
      selectedServices.some(
        (service) =>
          service.primary_place_id === "kingston-on" &&
          !(service.coverage ?? []).some((area) => area.placeIds?.includes("brampton-on"))
      )
    ).toBe(false)
  })

  it("rejects missing approved records", () => {
    const [missingId] = APPROVED_BRAMPTON_SERVICE_IDS
    const incompleteServices = services.filter((service) => service.id !== missingId)

    expect(() => buildBramptonProductionSyncPlan({ services: incompleteServices, embeddings })).toThrow(
      `Missing approved Brampton service: ${missingId}`
    )
  })

  it("rejects approved records without Brampton coverage", () => {
    const [id] = APPROVED_BRAMPTON_SERVICE_IDS
    const coverageBrokenServices = services.map((service) =>
      service.id === id
        ? {
            ...service,
            primary_place_id: "kingston-on" as const,
            coverage: [{ kind: "local" as const, placeIds: ["kingston-on" as const] }],
          }
        : service
    )

    expect(() => buildBramptonProductionSyncPlan({ services: coverageBrokenServices, embeddings })).toThrow(
      `Approved Brampton service lacks Brampton coverage: ${id}`
    )
  })

  it("rejects approved records without 384-dimensional embeddings", () => {
    const [id] = APPROVED_BRAMPTON_SERVICE_IDS
    const brokenEmbeddings = { ...embeddings, [id]: [0, 1, 2] }

    expect(() => buildBramptonProductionSyncPlan({ services, embeddings: brokenEmbeddings })).toThrow(
      `Missing 384-dimensional embedding for approved Brampton service: ${id}`
    )
  })
})

describe("Brampton production sync CLI guardrails", () => {
  it("uses an explicit approval token for write mode", () => {
    expect(BRAMPTON_SYNC_APPROVAL_TOKEN).toBe("I_APPROVE_SYNCING_APPROVED_BRAMPTON_RECORDS")
    expect(BRAMPTON_SYNC_APPROVAL_TOKEN.length).toBeGreaterThan(10)
  })

  it("requires the exact approval token before apply mode can write", () => {
    expect(() => assertBramptonSyncApplyApproval(undefined)).toThrow(
      "BRAMPTON_SYNC_APPROVAL must equal I_APPROVE_SYNCING_APPROVED_BRAMPTON_RECORDS before --apply can write"
    )
    expect(() => assertBramptonSyncApplyApproval("I approve")).toThrow(
      "BRAMPTON_SYNC_APPROVAL must equal I_APPROVE_SYNCING_APPROVED_BRAMPTON_RECORDS before --apply can write"
    )
    expect(() => assertBramptonSyncApplyApproval(BRAMPTON_SYNC_APPROVAL_TOKEN)).not.toThrow()
  })

  it("parses dry-run and apply modes while rejecting unknown arguments", () => {
    expect(parseBramptonSyncArgs([])).toEqual({ mode: "dry-run" })
    expect(parseBramptonSyncArgs(["--dry-run"])).toEqual({ mode: "dry-run" })
    expect(parseBramptonSyncArgs(["--apply"])).toEqual({ mode: "apply" })

    expect(() => parseBramptonSyncArgs(["--apply", "--dry-run"])).toThrow("Use exactly one mode: --dry-run or --apply")
    expect(() => parseBramptonSyncArgs(["--force"])).toThrow("Unsupported argument: --force")
  })

  it("recognizes placeholder Supabase secret keys as unusable", () => {
    expect(isUsableSupabaseSecretKey(undefined)).toBe(false)
    expect(isUsableSupabaseSecretKey("")).toBe(false)
    expect(isUsableSupabaseSecretKey("your-secret-key")).toBe(false)
    expect(isUsableSupabaseSecretKey("replace-me")).toBe(false)
    expect(isUsableSupabaseSecretKey(`valid-${"a".repeat(40)}`)).toBe(true)
    expect(isUsableSupabaseSecretKey("a".repeat(80))).toBe(true)
  })
})

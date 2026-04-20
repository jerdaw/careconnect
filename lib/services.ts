import { supabase } from "./supabase"
import { logger } from "./logger"
import { normalizeProvenance } from "@/lib/provenance"
import { Provenance, Service, VerificationLevel } from "@/types/service"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"
import { mapServiceToDatabaseUpdate } from "@/lib/service-db"
import { hasSupabaseCredentials } from "@/lib/supabase"
import { mapServicePublicToService } from "@/lib/search/map-service-public"
import type { ServicePublicAuthorityTier, ServicePublicScope } from "@/types/service-public"

let staticServicesPromise: Promise<Service[]> | null = null

type ServiceRow = Record<string, unknown> & {
  embedding?: string | number[] | null
  tags?: string | Service["identity_tags"] | null
  category?: Service["intent_category"]
  verification_status?: Service["verification_level"]
  provenance?: string | Partial<Provenance> | null
  synthetic_queries?: string | string[] | null
  synthetic_queries_fr?: string | string[] | null
  hours?: string | Service["hours"] | null
  accessibility?: string | Service["accessibility"] | null
  languages?: string | string[] | null
  bus_routes?: string | string[] | null
  coordinates?: string | Service["coordinates"] | null
}

async function loadStaticServices(): Promise<Service[]> {
  if (!staticServicesPromise) {
    staticServicesPromise = import("@/data/services.json").then(
      ({ default: servicesData }) => servicesData as Service[]
    )
  }

  return staticServicesPromise
}

function parseJsonField<T>(value: unknown): T | undefined {
  if (value == null) return undefined

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T
    } catch {
      return undefined
    }
  }

  return value as T
}

/**
 * Claims a service for the current authenticated user's organization.
 *
 * @param serviceId - The ID of the service to claim
 * @param orgId - The ID of the organization claiming the service
 */
export async function claimService(serviceId: string, orgId: string) {
  try {
    const { error } = await withCircuitBreaker(
      async () =>
        supabase
          .from("services")
          .update({
            org_id: orgId,
            verification_status: "L1", // Elevate to L1 upon claiming
            last_verified: new Date().toISOString(),
          })
          .eq("id", serviceId)
          .is("org_id", null) // Atomic check to ensure it's not already claimed
    )

    if (error) {
      logger.error("Failed to claim service", error, { serviceId, orgId })
      return { error: error.message }
    }

    return { success: true }
  } catch (err) {
    logger.error("Unexpected error in claimService", err as Error, { serviceId, orgId })
    return { error: "An unexpected error occurred" }
  }
}

/**
 * Fetches a service by ID and maps it to the Service type.
 */
export async function getServiceById(id: string): Promise<Service | null> {
  try {
    if (!hasSupabaseCredentials()) {
      const staticService = (await loadStaticServices()).find((service) => service.id === id)
      return staticService ?? null
    }

    // Query the public view (accessible by anon users) instead of the protected services table
    const { data, error } = await withCircuitBreaker(async () =>
      supabase.from("services_public").select("*").eq("id", id).single()
    )

    if (error) {
      if (error.code !== "PGRST116") {
        // Not found code
        logger.error("Error fetching service by ID", error, { id })
      }
      const staticService = (await loadStaticServices()).find((service) => service.id === id)
      return staticService ?? null
    }

    if (!data) return null

    const serviceRow = data as ServiceRow

    return mapServicePublicToService({
      ...serviceRow,
      id: String(serviceRow.id ?? id),
      name: String(serviceRow.name ?? ""),
      description: typeof serviceRow.description === "string" ? serviceRow.description : null,
      description_fr: typeof serviceRow.description_fr === "string" ? serviceRow.description_fr : null,
      name_fr: typeof serviceRow.name_fr === "string" ? serviceRow.name_fr : null,
      address: typeof serviceRow.address === "string" ? serviceRow.address : null,
      address_fr: typeof serviceRow.address_fr === "string" ? serviceRow.address_fr : null,
      phone: typeof serviceRow.phone === "string" ? serviceRow.phone : null,
      url: typeof serviceRow.url === "string" ? serviceRow.url : null,
      email: typeof serviceRow.email === "string" ? serviceRow.email : null,
      hours: parseJsonField<Service["hours"]>(serviceRow.hours) ?? null,
      hours_text: typeof serviceRow.hours_text === "string" ? serviceRow.hours_text : null,
      hours_text_fr: typeof serviceRow.hours_text_fr === "string" ? serviceRow.hours_text_fr : null,
      fees: typeof serviceRow.fees === "string" ? serviceRow.fees : null,
      eligibility: typeof serviceRow.eligibility === "string" ? serviceRow.eligibility : null,
      eligibility_fr: typeof serviceRow.eligibility_fr === "string" ? serviceRow.eligibility_fr : null,
      eligibility_notes: typeof serviceRow.eligibility === "string" ? serviceRow.eligibility : null,
      eligibility_notes_fr: typeof serviceRow.eligibility_fr === "string" ? serviceRow.eligibility_fr : null,
      application_process: typeof serviceRow.application_process === "string" ? serviceRow.application_process : null,
      application_process_fr:
        typeof serviceRow.application_process_fr === "string" ? serviceRow.application_process_fr : null,
      languages: parseJsonField<Service["languages"]>(serviceRow.languages) ?? null,
      bus_routes: parseJsonField<Service["bus_routes"]>(serviceRow.bus_routes) ?? null,
      accessibility: parseJsonField<Service["accessibility"]>(serviceRow.accessibility) ?? null,
      last_verified: typeof serviceRow.last_verified === "string" ? serviceRow.last_verified : null,
      verification_status:
        typeof serviceRow.verification_status === "string"
          ? (serviceRow.verification_status as VerificationLevel)
          : VerificationLevel.L0,
      category: typeof serviceRow.category === "string" ? serviceRow.category : null,
      tags: parseJsonField<Service["identity_tags"]>(serviceRow.tags) ?? null,
      scope: (typeof serviceRow.scope === "string" ? serviceRow.scope : null) as ServicePublicScope,
      virtual_delivery: typeof serviceRow.virtual_delivery === "boolean" ? serviceRow.virtual_delivery : null,
      primary_phone_label: typeof serviceRow.primary_phone_label === "string" ? serviceRow.primary_phone_label : null,
      created_at: typeof serviceRow.created_at === "string" ? serviceRow.created_at : new Date().toISOString(),
      synthetic_queries: parseJsonField<Service["synthetic_queries"]>(serviceRow.synthetic_queries) ?? null,
      synthetic_queries_fr: parseJsonField<Service["synthetic_queries_fr"]>(serviceRow.synthetic_queries_fr) ?? null,
      authority_tier: (typeof serviceRow.authority_tier === "string"
        ? serviceRow.authority_tier
        : null) as ServicePublicAuthorityTier,
      resource_indicators: parseJsonField<Service["resource_indicators"]>(serviceRow.resource_indicators) ?? null,
      coordinates: parseJsonField<Service["coordinates"]>(serviceRow.coordinates) ?? null,
      provenance: normalizeProvenance(serviceRow.provenance),
      access_script: typeof serviceRow.access_script === "string" ? serviceRow.access_script : null,
      access_script_fr: typeof serviceRow.access_script_fr === "string" ? serviceRow.access_script_fr : null,
    })
  } catch (error) {
    logger.error("Unexpected error in getServiceById", error as Error, { id })
    return null
  }
}
/**
 * Updates an existing service record.
 */
export async function updateService(id: string, updates: Partial<Service>) {
  try {
    const databaseUpdates = mapServiceToDatabaseUpdate(updates)

    const { error } = await withCircuitBreaker(async () =>
      supabase.from("services").update(databaseUpdates).eq("id", id)
    )

    if (error) {
      logger.error("Failed to update service", error, { id, updates })
      return { error: error.message }
    }

    return { success: true }
  } catch (err) {
    logger.error("Unexpected error in updateService", err as Error, { id, updates })
    return { error: "An unexpected error occurred" }
  }
}

import { supabase } from "./supabase"
import { logger } from "./logger"
import { normalizeProvenance } from "@/lib/provenance"
import { Provenance, Service, VerificationLevel } from "@/types/service"
import { withCircuitBreaker } from "@/lib/resilience/supabase-breaker"
import { mapServiceToDatabaseUpdate } from "@/lib/service-db"

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
    // Query the public view (accessible by anon users) instead of the protected services table
    const { data, error } = await withCircuitBreaker(async () =>
      supabase.from("services_public").select("*").eq("id", id).single()
    )

    if (error) {
      if (error.code !== "PGRST116") {
        // Not found code
        logger.error("Error fetching service by ID", error, { id })
      }
      return null
    }

    if (!data) return null

    const serviceRow = data as ServiceRow
    const staticService = (await loadStaticServices()).find((service) => service.id === id)

    // Map database fields to Service type
    const service: Service = {
      ...staticService,
      ...serviceRow,
      embedding: parseJsonField<Service["embedding"]>(serviceRow.embedding) ?? staticService?.embedding,
      hours: parseJsonField<Service["hours"]>(serviceRow.hours) ?? staticService?.hours,
      accessibility: parseJsonField<Service["accessibility"]>(serviceRow.accessibility) ?? staticService?.accessibility,
      languages: parseJsonField<Service["languages"]>(serviceRow.languages) ?? staticService?.languages,
      bus_routes: parseJsonField<Service["bus_routes"]>(serviceRow.bus_routes) ?? staticService?.bus_routes,
      coordinates: parseJsonField<Service["coordinates"]>(serviceRow.coordinates) ?? staticService?.coordinates,
      identity_tags: parseJsonField<Service["identity_tags"]>(serviceRow.tags) ?? staticService?.identity_tags ?? [],
      intent_category: serviceRow.category ?? staticService?.intent_category,
      verification_level: serviceRow.verification_status ?? staticService?.verification_level ?? VerificationLevel.L0,
      provenance: normalizeProvenance(serviceRow.provenance, {
        fallback: staticService?.provenance,
      }),
      synthetic_queries:
        parseJsonField<Service["synthetic_queries"]>(serviceRow.synthetic_queries) ??
        staticService?.synthetic_queries ??
        [],
      synthetic_queries_fr:
        parseJsonField<Service["synthetic_queries_fr"]>(serviceRow.synthetic_queries_fr) ??
        staticService?.synthetic_queries_fr,
    } as unknown as Service

    return service
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

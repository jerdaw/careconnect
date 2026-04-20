import { mapServiceToDatabaseUpsert, type ServiceRow, type ServiceUpdate } from "@/lib/service-db"
import type { Service } from "@/types/service"

export const CURATED_RUNTIME_BACKFILL_FIELDS = [
  "name",
  "name_fr",
  "description",
  "description_fr",
  "address",
  "address_fr",
  "phone",
  "url",
  "email",
  "hours",
  "hours_text",
  "hours_text_fr",
  "fees",
  "fees_fr",
  "eligibility",
  "eligibility_fr",
  "application_process",
  "application_process_fr",
  "languages",
  "bus_routes",
  "accessibility",
  "last_verified",
  "verification_status",
  "category",
  "tags",
  "scope",
  "virtual_delivery",
  "primary_phone_label",
  "authority_tier",
  "resource_indicators",
  "synthetic_queries",
  "synthetic_queries_fr",
  "coordinates",
  "provenance",
  "access_script",
  "access_script_fr",
] as const satisfies ReadonlyArray<keyof ServiceUpdate>

function isMeaningfullyEmpty(value: unknown): boolean {
  if (value == null) {
    return true
  }

  if (typeof value === "string") {
    return value.trim().length === 0
  }

  if (Array.isArray(value)) {
    return value.length === 0 || value.every((item) => isMeaningfullyEmpty(item))
  }

  if (typeof value === "object") {
    const values = Object.values(value as Record<string, unknown>)
    return values.length === 0 || values.every((item) => isMeaningfullyEmpty(item))
  }

  return false
}

/**
 * Build a rollout-safe update that fills DB-authoritative runtime fields from the
 * curated JSON snapshot only when the current DB row is blank or missing.
 */
export function buildCuratedRuntimeBackfillUpdate(
  currentRow: Partial<ServiceRow> | null | undefined,
  curatedService: Partial<Service> & Pick<Service, "id" | "name">
): ServiceUpdate {
  const curatedRow = mapServiceToDatabaseUpsert(curatedService)
  const update: ServiceUpdate = {}
  const updateRecord = update as Record<string, unknown>

  for (const field of CURATED_RUNTIME_BACKFILL_FIELDS) {
    const curatedValue = curatedRow[field]
    const currentValue = currentRow?.[field]

    if (curatedValue === undefined || isMeaningfullyEmpty(curatedValue)) {
      continue
    }

    if (!isMeaningfullyEmpty(currentValue)) {
      continue
    }

    updateRecord[field] = curatedValue
  }

  return update
}

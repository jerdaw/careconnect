export const PUBLIC_VERIFIER_LABEL = "CareConnect Admin"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function sanitizePublicProvenance<T>(provenance: T): T {
  if (!isRecord(provenance)) {
    return provenance
  }

  const verifiedBy = provenance.verified_by
  if (typeof verifiedBy !== "string" || !UUID_PATTERN.test(verifiedBy)) {
    return provenance
  }

  return {
    ...provenance,
    verified_by: PUBLIC_VERIFIER_LABEL,
  } as T
}

export function sanitizePublicServiceProvenance<T extends { provenance?: unknown }>(service: T): T {
  const sanitizedProvenance = sanitizePublicProvenance(service.provenance)
  if (sanitizedProvenance === service.provenance) {
    return service
  }

  return {
    ...service,
    provenance: sanitizedProvenance,
  }
}

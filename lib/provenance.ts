import type { Provenance } from "@/types/service"

function parsePartialProvenance(value: unknown): Partial<Provenance> | undefined {
  if (value == null) return undefined

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown
      if (typeof parsed === "object" && parsed !== null) {
        return parsed as Partial<Provenance>
      }
    } catch {
      return undefined
    }
    return undefined
  }

  if (typeof value === "object") {
    return value as Partial<Provenance>
  }

  return undefined
}

function firstNonEmpty(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value
    }
  }

  return ""
}

export function normalizeProvenance(
  value: unknown,
  options: {
    fallback?: Partial<Provenance> | null
  } = {}
): Provenance {
  const parsed = parsePartialProvenance(value)

  return {
    verified_by: firstNonEmpty(parsed?.verified_by, options.fallback?.verified_by),
    verified_at: firstNonEmpty(parsed?.verified_at, options.fallback?.verified_at),
    evidence_url: firstNonEmpty(parsed?.evidence_url, options.fallback?.evidence_url),
    method: firstNonEmpty(parsed?.method, options.fallback?.method),
  }
}

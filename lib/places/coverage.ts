import type { PlaceId, Service, ServiceCoverageArea } from "@/types/service"
import { getPlaceById } from "@/lib/places/registry"

type CoverageCompatibleService = {
  coverage?: ServiceCoverageArea[] | null
  scope?: Service["scope"] | null
}

export interface CoverageBadge {
  key: string
  label: string
  kind: ServiceCoverageArea["kind"]
}

export function normalizeServiceCoverage(service: CoverageCompatibleService): ServiceCoverageArea[] {
  if (service.coverage && service.coverage.length > 0) {
    return service.coverage
  }

  if (service.scope === "kingston" || !service.scope) {
    return [{ kind: "local", placeIds: ["kingston-on"] }]
  }

  if (service.scope === "ontario") {
    return [{ kind: "provincial", label: "Ontario-wide" }]
  }

  if (service.scope === "canada") {
    return [{ kind: "national", label: "Canada-wide" }]
  }

  return []
}

export function serviceServesPlace(service: CoverageCompatibleService, placeId: PlaceId): boolean {
  return normalizeServiceCoverage(service).some((coverage) => {
    if (coverage.kind === "provincial" || coverage.kind === "national") {
      return true
    }

    return coverage.placeIds?.includes(placeId) ?? false
  })
}

export function filterServicesByPlace<T extends { service: CoverageCompatibleService }>(
  results: T[],
  placeId: PlaceId | undefined
): T[] {
  if (!placeId) return results
  return results.filter((result) => serviceServesPlace(result.service, placeId))
}

export function getPrimaryPlaceLabel(service: Pick<Service, "primary_place_id">): string | undefined {
  return getPlaceById(service.primary_place_id)?.serviceLabel
}

export function getCoverageBadges(service: Pick<Service, "coverage" | "scope">): CoverageBadge[] {
  return normalizeServiceCoverage(service).flatMap((coverage, index) => {
    if (coverage.kind === "provincial") {
      return [{ key: `provincial-${index}`, label: coverage.label ?? "Ontario-wide", kind: coverage.kind }]
    }

    if (coverage.kind === "national") {
      return [{ key: `national-${index}`, label: coverage.label ?? "Canada-wide", kind: coverage.kind }]
    }

    return (coverage.placeIds ?? []).flatMap((placeId) => {
      const place = getPlaceById(placeId)
      if (!place) return []
      return [
        {
          key: `${coverage.kind}-${place.id}`,
          label: coverage.label ?? place.serviceLabel,
          kind: coverage.kind,
        },
      ]
    })
  })
}

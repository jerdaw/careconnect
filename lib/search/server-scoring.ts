import { rankServicesByQuery } from "./scoring"
import { mapServicePublicToService } from "./map-service-public"
import { ServicePublic } from "@/types/service-public"

export interface ServerScoredResult {
  service: ServicePublic
  score: number
  matchReasons: string[]
}

export interface ServerScoringOptions {
  location?: { lat: number; lng: number }
  locale?: string
  category?: string
  allowFilterOnlyBaseMatch?: boolean
}

/**
 * Server-side wrapper around the shared ranking pipeline used by local search.
 * This keeps authority/completeness/intent/proximity behavior aligned across modes.
 */
export function scoreServicesServer(
  services: ServicePublic[],
  query: string,
  options: ServerScoringOptions = {}
): ServerScoredResult[] {
  const mappedServices = services.map((service) => mapServicePublicToService(service))
  const publicById = new Map(services.map((service) => [service.id, service]))

  return rankServicesByQuery(mappedServices, query, {
    category: options.category,
    location: options.location,
    allowFilterOnlyBaseMatch: options.allowFilterOnlyBaseMatch,
  })
    .map((result) => {
      const originalService = publicById.get(result.service.id)
      if (!originalService) {
        return null
      }

      return {
        service: originalService,
        score: result.score,
        matchReasons: result.matchReasons,
      }
    })
    .filter((result): result is ServerScoredResult => result !== null)
}

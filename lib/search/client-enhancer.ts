import { type SearchResult } from "./types"
import { type SearchMode } from "./search-mode"
import { filterServicesByPlace } from "@/lib/places/coverage"
import type { PlaceId } from "@/types/service"

type SearchScope = "all" | "kingston" | "provincial"

interface VectorUpgradeOptions {
  query: string
  category?: string
  userLocation?: { lat: number; lng: number }
  openNow?: boolean
  isReady: boolean
  mode: SearchMode
  scope: SearchScope
  placeId?: PlaceId
  generateEmbedding: (text: string) => Promise<number[] | null>
  search: (
    query: string,
    options: {
      category?: string
      location?: { lat: number; lng: number }
      vectorOverride?: number[] | null
      openNow?: boolean
      placeId?: PlaceId
    }
  ) => Promise<SearchResult[]>
}

export function filterSearchResultsByScope(results: SearchResult[], scope: SearchScope): SearchResult[] {
  if (scope === "all") return results

  if (scope === "kingston") {
    return results.filter((result) => result.service.scope === "kingston" || !result.service.scope)
  }

  return results.filter((result) => result.service.scope === "ontario" || result.service.scope === "canada")
}

export function filterSearchResultsByPlace(results: SearchResult[], placeId: PlaceId | undefined): SearchResult[] {
  return filterServicesByPlace(results, placeId)
}

export async function enhanceSearchResults({
  query,
  category,
  userLocation,
  openNow,
  isReady,
  mode,
  scope,
  placeId,
  generateEmbedding,
  search,
}: VectorUpgradeOptions): Promise<SearchResult[] | null> {
  if (mode !== "local" || !isReady || query.trim().length === 0) {
    return null
  }

  const embedding = await generateEmbedding(query)
  if (!embedding) {
    return null
  }

  const enhancedResults = await search(query, {
    category,
    location: userLocation,
    vectorOverride: embedding,
    openNow,
    placeId,
  })

  return filterSearchResultsByPlace(filterSearchResultsByScope(enhancedResults, scope), placeId)
}

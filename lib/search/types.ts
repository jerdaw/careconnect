import { Service } from "@/types/service"
import type { PlaceId } from "@/types/service"

export interface SearchResult {
  service: Service
  score: number
  matchReasons: string[]
}

export interface SearchOptions {
  category?: string
  location?: { lat: number; lng: number }
  vectorOverride?: number[] | null
  openNow?: boolean
  placeId?: PlaceId

  limit?: number
  userContext?: import("@/types/user-context").UserContext
  useAIExpansion?: boolean
  onSuggestion?: (suggestion: string) => void
}

export interface ScoringWeights {
  vector: number
  syntheticQuery: number
  name: number
  identityTag: number
  description: number
}

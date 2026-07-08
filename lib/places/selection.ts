import type { PlaceId } from "@/types/service"
import { getPlaceById, isSupportedPlaceId, SUPPORTED_PLACES } from "@/lib/places/registry"

export const SELECTED_PLACE_STORAGE_KEY = "careconnect_selected_place_id"
export const DEFAULT_PLACE_ID: PlaceId = "kingston-on"

export function getDefaultPlaceId(): PlaceId {
  return DEFAULT_PLACE_ID
}

export function normalizeSelectedPlace(value: unknown): PlaceId {
  return isSupportedPlaceId(value) ? value : DEFAULT_PLACE_ID
}

export function inferPlaceFromCoordinates(
  coordinates: { lat: number; lng: number } | null | undefined
): PlaceId | null {
  if (!coordinates) return null

  const match = SUPPORTED_PLACES.find((place) => {
    const { bounds } = place
    return (
      coordinates.lat <= bounds.north &&
      coordinates.lat >= bounds.south &&
      coordinates.lng <= bounds.east &&
      coordinates.lng >= bounds.west
    )
  })

  return match?.id ?? null
}

export function getSelectedPlaceLabel(placeId: PlaceId): string {
  return getPlaceById(placeId)?.serviceLabel ?? "Kingston"
}

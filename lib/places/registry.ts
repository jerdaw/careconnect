import type { PlaceId } from "@/types/service"
import type { SupportedPlace } from "@/lib/places/types"

export const SUPPORTED_PLACES: readonly SupportedPlace[] = [
  {
    id: "kingston-on",
    name: "Kingston",
    province: "Ontario",
    country: "Canada",
    status: "live",
    heroLabel: "Kingston",
    serviceLabel: "Kingston",
    centroid: { lat: 44.2312, lng: -76.486 },
    bounds: { north: 44.35, south: 44.12, east: -76.32, west: -76.72 },
  },
  {
    id: "brampton-on",
    name: "Brampton",
    province: "Ontario",
    country: "Canada",
    status: "live",
    heroLabel: "Brampton",
    serviceLabel: "Brampton",
    centroid: { lat: 43.7315, lng: -79.7624 },
    bounds: { north: 43.86, south: 43.61, east: -79.59, west: -79.89 },
  },
] as const

const PLACE_BY_ID = new Map<PlaceId, SupportedPlace>(SUPPORTED_PLACES.map((place) => [place.id, place]))

export function getPlaceById(placeId: PlaceId | string | undefined): SupportedPlace | undefined {
  if (!placeId) return undefined
  return PLACE_BY_ID.get(placeId as PlaceId)
}

export function getHeroPlaces(): SupportedPlace[] {
  return SUPPORTED_PLACES.filter((place) => place.status === "live" || place.status === "preview")
}

export function isSupportedPlaceId(value: unknown): value is PlaceId {
  return typeof value === "string" && PLACE_BY_ID.has(value as PlaceId)
}

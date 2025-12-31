import { SearchResult } from "./types"

const toRad = (value: number) => (value * Math.PI) / 180

export const calculateDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371 // Radius of Earth in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Hybrid re-ranking for Geolocation
 */
export const resortByDistance = (results: SearchResult[], userLoc: { lat: number; lng: number }): SearchResult[] => {
  return results.sort((a, b) => {
    // Calculate distances
    const distA = a.service.coordinates
      ? calculateDistanceKm(userLoc.lat, userLoc.lng, a.service.coordinates.lat, a.service.coordinates.lng)
      : Infinity
    const distB = b.service.coordinates
      ? calculateDistanceKm(userLoc.lat, userLoc.lng, b.service.coordinates.lat, b.service.coordinates.lng)
      : Infinity

    // Bucket scores: if relevance is significantly different (> 50 points), respect relevance.
    // Otherwise, prioritize distance.
    if (Math.abs(a.score - b.score) > 50) {
      return b.score - a.score
    }

    return distA - distB
  })
}

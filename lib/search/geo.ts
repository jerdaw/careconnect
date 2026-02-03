import { SearchResult } from "./types"

const EARTH_RADIUS_KM = 6371

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

export const calculateDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const latDiffRadians = toRadians(lat2 - lat1)
  const lngDiffRadians = toRadians(lng2 - lng1)

  const haversineValue =
    Math.sin(latDiffRadians / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(lngDiffRadians / 2) ** 2

  const centralAngleRadians = 2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue))

  return EARTH_RADIUS_KM * centralAngleRadians
}

/**
 * Proximity decay constants.
 * v16.0: Enhanced proximity integration.
 */
export const PROXIMITY_CONFIG = {
  // Standard decay factor: 50% weight at 25km, 33% at 50km
  standardDecayK: 0.02,
  // Reduced decay for provincial/national services: 50% at 100km
  wideAreaDecayK: 0.005,
  // No penalty for virtual services (multiplier = 1.0)
  virtualMultiplier: 1.0,
}

/**
 * Returns a proximity-based score multiplier.
 * Closer services get higher multipliers (up to 1.0).
 * v16.0: Search ranking improvement.
 *
 * @param distanceKm - Distance in kilometers
 * @param isVirtual - If true, service has no physical location requirement
 * @param isWideArea - If true, service is provincial/national scope
 * @returns Multiplier between 0 and 1
 */
export function getProximityMultiplier(
  distanceKm: number,
  isVirtual: boolean = false,
  isWideArea: boolean = false
): number {
  // Virtual services get no proximity penalty
  if (isVirtual) {
    return PROXIMITY_CONFIG.virtualMultiplier
  }

  // Use appropriate decay factor
  const k = isWideArea ? PROXIMITY_CONFIG.wideAreaDecayK : PROXIMITY_CONFIG.standardDecayK

  // Decay formula: 1 / (1 + k * distance)
  // At distance 0: multiplier = 1.0
  // At distance d where k*d = 1: multiplier = 0.5
  return 1 / (1 + k * distanceKm)
}

/**
 * Applies proximity decay to search results and sorts them.
 * Combines relevance score with proximity for final ranking.
 * v16.0: Enhanced from bucket-based to continuous decay.
 */
export const resortByDistance = (results: SearchResult[], userLoc: { lat: number; lng: number }): SearchResult[] => {
  // Apply proximity decay to scores
  const scoredResults = results.map((result) => {
    const service = result.service

    // Determine if service is virtual or wide-area
    const isVirtual = service.virtual_delivery === true
    const isWideArea = service.scope === "ontario" || service.scope === "canada"

    // Calculate distance
    let distance = Infinity
    if (service.coordinates) {
      distance = calculateDistanceKm(userLoc.lat, userLoc.lng, service.coordinates.lat, service.coordinates.lng)
    }

    // Get proximity multiplier
    const proximityMultiplier = getProximityMultiplier(distance, isVirtual, isWideArea)

    // Apply proximity decay to score
    const adjustedScore = result.score * proximityMultiplier

    // Add proximity info to match reasons if significant
    const proximityPercent = Math.round(proximityMultiplier * 100)
    const updatedReasons = [...result.matchReasons]

    if (isVirtual) {
      // Don't add reason for virtual services (no location impact)
    } else if (distance < Infinity && proximityPercent < 95) {
      if (proximityPercent >= 80) {
        updatedReasons.push(`Near You (${Math.round(distance)}km)`)
      } else {
        updatedReasons.push(`Distance Adjusted (${Math.round(distance)}km, ${proximityPercent}%)`)
      }
    }

    return {
      ...result,
      score: adjustedScore,
      matchReasons: updatedReasons,
      distance, // Preserve for potential display
    }
  })

  // Sort by adjusted score (descending)
  return scoredResults.sort((a, b) => b.score - a.score)
}

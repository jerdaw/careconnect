/**
 * Test Fixtures for Load Testing
 *
 * Sample queries and test data for load tests
 */

/**
 * Sample search queries (real user queries)
 */
export const sampleQueries = [
  // Common searches
  "food bank",
  "mental health",
  "housing",
  "employment",
  "childcare",
  "healthcare",
  "seniors",
  "youth programs",
  "addiction",
  "domestic violence",

  // Crisis queries
  "suicide",
  "emergency",
  "crisis",

  // Specific needs
  "diabetes support",
  "french services",
  "wheelchair accessible",
  "free dental",
  "legal aid",
  "immigration help",

  // Location-based
  "food bank kingston",
  "mental health near me",
  "shelter downtown",

  // Empty query (filter-only)
  "",
]

/**
 * Sample categories
 */
export const sampleCategories = [
  "Food",
  "Housing",
  "Healthcare",
  "Mental Health",
  "Employment",
  "Legal",
  "Crisis",
  "Youth",
  "Seniors",
  "Newcomers",
]

/**
 * Sample locations (Kingston area)
 */
export const sampleLocations = [
  { lat: 44.2312, lng: -76.486 }, // Downtown Kingston
  { lat: 44.2639, lng: -76.5197 }, // West Kingston
  { lat: 44.2456, lng: -76.4562 }, // East Kingston
  { lat: 44.2089, lng: -76.5289 }, // South Kingston
  { lat: 44.2798, lng: -76.4512 }, // North Kingston
]

/**
 * Get a random query
 */
export function randomQuery() {
  return sampleQueries[Math.floor(Math.random() * sampleQueries.length)]
}

/**
 * Get a random category
 */
export function randomCategory() {
  // 70% chance of no category filter
  if (Math.random() < 0.7) {
    return undefined
  }
  return sampleCategories[Math.floor(Math.random() * sampleCategories.length)]
}

/**
 * Get a random location
 */
export function randomLocation() {
  // 50% chance of no location
  if (Math.random() < 0.5) {
    return undefined
  }
  return sampleLocations[Math.floor(Math.random() * sampleLocations.length)]
}

/**
 * Get a random locale
 */
export function randomLocale() {
  // 90% English, 10% French (realistic distribution)
  return Math.random() < 0.9 ? "en" : "fr"
}

/**
 * Generate a realistic search request
 */
export function generateRealisticSearch() {
  return {
    query: randomQuery(),
    category: randomCategory(),
    location: randomLocation(),
    locale: randomLocale(),
    limit: 20,
    offset: 0,
  }
}

/**
 * k6 Load Testing Configuration
 *
 * Shared configuration for all load tests
 */

// Base URL - can be overridden via environment variable
export const BASE_URL = __ENV.BASE_URL || "http://localhost:3000"

/**
 * Default thresholds for all tests
 */
export const defaultThresholds = {
  // HTTP-specific metrics
  http_req_duration: ["p(95)<1000", "p(99)<2000"], // 95% < 1s, 99% < 2s
  http_req_failed: ["rate<0.05"], // Error rate < 5%

  // General metrics
  checks: ["rate>0.95"], // 95% of checks should pass
}

/**
 * HTTP headers for API requests
 */
export const defaultHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json",
}

/**
 * Common rate limits (as defined in the app)
 */
export const RATE_LIMITS = {
  search: 60, // 60 requests per minute
}

/**
 * Sleep durations (in seconds)
 */
export const SLEEP = {
  short: 1,
  medium: 2,
  long: 5,
}

/**
 * Stages for ramping tests
 */
export const rampStages = {
  // Gradual ramp up over 2 minutes
  rampUp: [
    { duration: "30s", target: 10 },
    { duration: "30s", target: 20 },
    { duration: "1m", target: 50 },
  ],

  // Sustained load for 5 minutes
  sustained: [{ duration: "5m", target: 50 }],

  // Gradual ramp down over 1 minute
  rampDown: [
    { duration: "30s", target: 20 },
    { duration: "30s", target: 0 },
  ],
}

/**
 * Create a search request body
 */
export function createSearchRequest(query, options = {}) {
  return JSON.stringify({
    query: query || "",
    locale: options.locale || "en",
    filters: {
      category: options.category || undefined,
    },
    options: {
      limit: options.limit || 20,
      offset: options.offset || 0,
    },
    location: options.location || undefined,
  })
}

/**
 * Validate search response
 */
export function validateSearchResponse(response) {
  const checks = {}

  checks["status is 200"] = response.status === 200

  if (response.status === 200) {
    const body = JSON.parse(response.body)
    checks["has data array"] = Array.isArray(body.data)
    checks["has meta object"] = typeof body.meta === "object"

    if (body.meta) {
      checks["meta has total"] = typeof body.meta.total === "number"
      checks["meta has limit"] = typeof body.meta.limit === "number"
      checks["meta has offset"] = typeof body.meta.offset === "number"
    }
  }

  return checks
}

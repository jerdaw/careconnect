/**
 * Search API Load Test
 *
 * Realistic load test for the search endpoint with various scenarios:
 * - Keyword searches
 * - Category filters
 * - Location-based searches
 * - Crisis queries
 *
 * Ramps from 10 to 50 VUs over 5 minutes
 *
 * Run: npm run test:load
 */

import http from "k6/http"
import { check, sleep } from "k6"
import { Rate, Trend } from "k6/metrics"
import {
  BASE_URL,
  defaultHeaders,
  defaultThresholds,
  createSearchRequest,
  validateSearchResponse,
} from "./utils/config.js"
import { generateSummary } from "./utils/reporting.js"
import { generateRealisticSearch } from "./utils/fixtures.js"

// Custom metrics
const searchErrorRate = new Rate("search_errors")
const searchDuration = new Trend("search_duration")

export const options = {
  stages: [
    { duration: "1m", target: 10 }, // Ramp up to 10 users
    { duration: "2m", target: 30 }, // Ramp up to 30 users
    { duration: "2m", target: 50 }, // Ramp up to 50 users
    { duration: "3m", target: 50 }, // Stay at 50 users
    { duration: "1m", target: 20 }, // Ramp down to 20 users
    { duration: "1m", target: 0 }, // Ramp down to 0 users
  ],
  thresholds: Object.assign({}, defaultThresholds, {
    http_req_duration: ["p(95)<800", "p(99)<1500"], // Tighter thresholds
    search_errors: ["rate<0.05"], // Custom metric threshold
  }),
}

export default function searchApiLoadTest() {
  // Generate a realistic search
  const searchParams = generateRealisticSearch()
  const searchBody = createSearchRequest(searchParams.query, searchParams)

  // Execute search
  const startTime = Date.now()
  const response = http.post(`${BASE_URL}/api/v1/search/services`, searchBody, { headers: defaultHeaders })
  const duration = Date.now() - startTime

  // Record custom metrics
  searchDuration.add(duration)
  searchErrorRate.add(response.status !== 200)

  // Validate response
  const checks = validateSearchResponse(response)
  check(response, checks)

  // Additional checks
  if (response.status === 200) {
    const body = JSON.parse(response.body)

    check(body, {
      "results are array": (b) => Array.isArray(b.data),
      "has reasonable result count": (b) => b.data.length >= 0 && b.data.length <= 100,
      "meta matches data": (b) => b.meta.total >= b.data.length,
    })

    // Log crisis detection (for monitoring)
    const isCrisisQuery = ["suicide", "crisis", "emergency"].some((term) =>
      searchParams.query.toLowerCase().includes(term)
    )
    if (isCrisisQuery && body.data.length > 0) {
      const firstResult = body.data[0]
      check(firstResult, {
        "crisis query returns crisis service first": (r) =>
          r.category === "Crisis" || r.name.toLowerCase().includes("988"),
      })
    }
  }

  // Think time (realistic user behavior)
  sleep(Math.random() * 2 + 1) // 1-3 seconds
}

export function handleSummary(data) {
  return generateSummary("search-api", data)
}

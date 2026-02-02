/**
 * Smoke Test
 *
 * Minimal load test to verify basic connectivity and functionality.
 * - 1 VU (Virtual User)
 * - 30 second duration
 * - Validates that the search API responds correctly
 *
 * Run: npm run test:load:smoke
 */

import http from "k6/http"
import { check, sleep } from "k6"
import {
  BASE_URL,
  defaultHeaders,
  defaultThresholds,
  createSearchRequest,
  validateSearchResponse,
} from "./utils/config.js"
import { generateSummary } from "./utils/reporting.js"

export const options = {
  vus: 1, // 1 virtual user
  duration: "30s",
  thresholds: Object.assign({}, defaultThresholds, {
    http_req_duration: ["p(95)<1000"], // Relaxed threshold for smoke test
  }),
}

export default function smokeTest() {
  // Test 1: Basic search with query
  const searchBody = createSearchRequest("food bank", { limit: 10 })
  const searchRes = http.post(`${BASE_URL}/api/v1/search/services`, searchBody, { headers: defaultHeaders })

  const searchChecks = validateSearchResponse(searchRes)
  check(searchRes, searchChecks)

  sleep(1)

  // Test 2: Category filter
  const categoryBody = createSearchRequest("", { category: "Food", limit: 10 })
  const categoryRes = http.post(`${BASE_URL}/api/v1/search/services`, categoryBody, { headers: defaultHeaders })

  check(categoryRes, validateSearchResponse(categoryRes))

  sleep(1)

  // Test 3: Health check endpoint
  const healthRes = http.get(`${BASE_URL}/api/v1/health`)

  check(healthRes, {
    "health check returns 200 or 503": (r) => r.status === 200 || r.status === 503,
    "health check has JSON response": (r) => {
      try {
        const body = JSON.parse(r.body)
        return body.status && body.checks
      } catch (_e) {
        return false
      }
    },
  })

  sleep(1)
}

export function handleSummary(data) {
  return generateSummary("smoke-test", data)
}

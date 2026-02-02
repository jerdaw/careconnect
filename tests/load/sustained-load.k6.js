/**
 * Sustained Load Test
 *
 * Long-running test to verify system stability under constant load.
 * - Constant 20 VUs
 * - 30 minute duration (can be adjusted)
 * - Monitors for memory leaks, performance degradation
 *
 * Run: npm run test:load:sustained
 */

import http from "k6/http"
import { check, sleep } from "k6"
import { Rate, Trend, Counter } from "k6/metrics"
import {
  BASE_URL,
  defaultHeaders,
  defaultThresholds,
  createSearchRequest,
  validateSearchResponse,
} from "./utils/config.js"
import { generateSummary } from "./utils/reporting.js"
import { generateRealisticSearch } from "./utils/fixtures.js"

// Custom metrics for monitoring stability
const searchErrorRate = new Rate("search_errors")
const searchDuration = new Trend("search_duration")
const totalSearches = new Counter("total_searches")

export const options = {
  stages: [
    { duration: "2m", target: 20 }, // Ramp up to 20 users
    { duration: "5m", target: 20 }, // Sustained load for 5 minutes (Shortened for baseline)
    { duration: "1m", target: 0 }, // Ramp down
  ],
  thresholds: Object.assign({}, defaultThresholds, {
    // Sustained load thresholds (more strict for stability)
    http_req_duration: ["p(95)<1000", "p(99)<2000"],
    http_req_failed: ["rate<0.05"],
    search_errors: ["rate<0.05"],
    checks: ["rate>0.95"],

    // Ensure performance doesn't degrade over time
    // If p99 exceeds 3s, something is wrong (memory leak, resource exhaustion)
    "http_req_duration{expected_response:true}": ["p(99)<3000"],
  }),
}

export default function sustainedLoadTest() {
  const searchParams = generateRealisticSearch()
  const searchBody = createSearchRequest(searchParams.query, searchParams)

  const startTime = Date.now()
  const response = http.post(`${BASE_URL}/api/v1/search/services`, searchBody, { headers: defaultHeaders })
  const duration = Date.now() - startTime

  // Record metrics
  totalSearches.add(1)
  searchDuration.add(duration)
  searchErrorRate.add(response.status !== 200)

  // Validate
  const checks = validateSearchResponse(response)
  check(response, checks)

  // Realistic think time
  sleep(Math.random() * 3 + 2) // 2-5 seconds

  // Every 100 requests, check health endpoint
  if (totalSearches.value % 100 === 0) {
    const healthRes = http.get(`${BASE_URL}/api/v1/health`)
    check(healthRes, {
      "health check responds": (r) => r.status === 200 || r.status === 503,
    })
  }
}

export function handleSummary(data) {
  return generateSummary("sustained-load", data)
}

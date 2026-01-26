/**
 * Spike Test
 *
 * Simulates a sudden, massive increase in traffic to test system resilience,
 * circuit breaker activation, and graceful degradation.
 *
 * - Sudden jump from 0 to 100 VUs
 * - Sustained for 1 minute
 * - Validates:
 *   - Circuit breaker (503)
 *   - Rate limiting (429)
 *   - Recovery after spike
 *
 * Run: npm run test:load:spike
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'
import {
  BASE_URL,
  defaultHeaders,
  defaultThresholds,
  createSearchRequest,
  validateSearchResponse,
} from './utils/config.js'
import { generateSummary } from './utils/reporting.js'
import { generateRealisticSearch } from './utils/fixtures.js'

// Custom metrics for resilience
const searchErrors = new Rate('search_errors')
const circuitBreakerActivations = new Counter('circuit_breaker_activations')
const searchDuration = new Trend('search_duration')
const rateLimitHits = new Counter('rate_limit_hits')

export const options = {
  stages: [
    { duration: '10s', target: 100 }, // SPIKE: 0 to 100 users in 10 seconds
    { duration: '1m', target: 100 },  // Hold spike for 1 minute
    { duration: '10s', target: 0 },   // Drop back to 0
  ],
  thresholds: Object.assign({}, defaultThresholds, {
    // Relaxed thresholds for spike test (expect some failures)
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.15'], // Allow up to 15% failure during spike
    search_errors: ['rate<0.15'],
    checks: ['rate>0.85'], // 85% checks passing is acceptable during spike
  }),
}

export default function spikeTest() {
  const searchParams = generateRealisticSearch()
  const payload = createSearchRequest(searchParams.query, searchParams)

  const startTime = Date.now()
  const response = http.post(`${BASE_URL}/api/v1/search/services`, payload, {
    headers: defaultHeaders,
  })
  
  const duration = Date.now() - startTime
  searchDuration.add(duration)

  // Consolidated checks and metric recording
  const checks = {
    'status is expected': (r) => {
      if (r.status === 200) return true
      
      if (r.status === 429) {
        rateLimitHits.add(1)
        return true
      }
      
      if (r.status === 503 && r.body && r.body.includes('circuit')) {
        circuitBreakerActivations.add(1)
        return true
      }
      
      return false
    },
  }

  // Add search results validation for successful requests
  if (response.status === 200) {
    const searchChecks = validateSearchResponse(response)
    Object.assign(checks, searchChecks)
  }

  check(response, checks)
  searchErrors.add(response.status !== 200)

  // Minimal think time during spike
  sleep(Math.random() * 0.5 + 0.1)
}

export function handleSummary(data) {
  return generateSummary('spike-test', data)
}

/**
 * Reporting Helper for k6 Load Tests
 */

/**
 * Generate a standardized summary for k6 tests
 * @param {string} testName - Name of the test
 * @param {object} data - k6 summary data
 * @returns {object} - k6 summary output configuration
 */
export function generateSummary(testName, data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `tests/load/results/${testName}-${timestamp}.json`
  const latestName = `tests/load/results/${testName}-latest.json`

  const summary = {
    test: testName,
    timestamp: new Date().toISOString(),
    metrics: {
      totalRequests: data.metrics.http_reqs.values.count,
      failedRequests: data.metrics.http_req_failed.values.rate,
      duration: {
        p50: data.metrics.http_req_duration.values['p(50)'],
        p95: data.metrics.http_req_duration.values['p(95)'],
        p99: data.metrics.http_req_duration.values['p(99)'],
        max: data.metrics.http_req_duration.values.max,
        avg: data.metrics.http_req_duration.values.avg,
      },
      vus: {
        max: data.metrics.vus ? data.metrics.vus.values.max : 0,
      }
    }
  }

  // Add custom metrics if they exist
  if (data.metrics.search_errors) {
    summary.metrics.searchErrors = data.metrics.search_errors.values.rate
  }
  if (data.metrics.search_duration) {
    summary.metrics.searchDuration = data.metrics.search_duration.values.avg
  }

  return {
    'stdout': renderTextSummary(testName, summary),
    [fileName]: JSON.stringify(summary, null, 2),
    [latestName]: JSON.stringify(summary, null, 2),
    [`tests/load/results/${testName}-raw.json`]: JSON.stringify(data, null, 2),
  }
}

/**
 * Render a clean text summary for stdout
 */
function renderTextSummary(testName, summary) {
  const m = summary.metrics
  const failPercent = (m.failedRequests * 100).toFixed(2)
  
  return `
================================================================
  ${testName.toUpperCase()} RESULTS
================================================================
  Total Requests:   ${m.totalRequests}
  Failed Requests:  ${failPercent}%
  Max VUs:          ${m.vus.max}

  Response Times (ms):
    p50:  ${m.duration.p50.toFixed(2)}
    p95:  ${m.duration.p95.toFixed(2)}
    p99:  ${m.duration.p99.toFixed(2)}
    max:  ${m.duration.max.toFixed(2)}
    avg:  ${m.duration.avg.toFixed(2)}
${m.searchDuration ? `
  Search Metrics:
    Avg Duration:   ${m.searchDuration.toFixed(2)}ms
    Error Rate:     ${(m.searchErrors * 100).toFixed(2)}%` : ''}
================================================================
`
}

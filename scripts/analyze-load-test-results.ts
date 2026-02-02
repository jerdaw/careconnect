#!/usr/bin/env node --import tsx

/**
 * Load Test Results Analyzer
 *
 * Parses k6 load test output and generates formatted baseline metrics.
 *
 * Usage:
 *   npm run test:load > results.txt
 *   node --import tsx scripts/analyze-load-test-results.ts results.txt
 */

import fs from "fs"
import path from "path"

interface K6Metrics {
  checks: string
  httpReqDuration: {
    avg: string
    min: string
    med: string
    max: string
    p90: string
    p95: string
    p99: string
  }
  httpReqFailed: string
  httpReqs: string
  httpReqsRate: string
  iterations: string
  vus: string
  vusMax: string
}

/**
 * Parse k6 text output to extract metrics
 */
function parseK6Output(output: string): Partial<K6Metrics> {
  const metrics: Partial<K6Metrics> = {}

  // Parse checks percentage
  const checksMatch = output.match(/checks[.\s]+:\s+([\d.]+)%/)
  if (checksMatch) {
    metrics.checks = checksMatch[1] + "%"
  }

  // Parse http_req_duration metrics
  const durationMatch = output.match(
    /http_req_duration[.\s]+:\s+avg=([\d.]+ms)\s+min=([\d.]+ms)\s+med=([\d.]+ms)\s+max=([\d.ms]+)\s+p\(90\)=([\d.]+ms)\s+p\(95\)=([\d.]+ms)/
  )
  if (durationMatch) {
    metrics.httpReqDuration = {
      avg: durationMatch[1],
      min: durationMatch[2],
      med: durationMatch[3],
      max: durationMatch[4],
      p90: durationMatch[5],
      p95: durationMatch[6],
      p99: "N/A", // k6 sometimes doesn't show p99 in summary
    }
  }

  // Try to find p99 separately
  const p99Match = output.match(/p\(99\)=([\d.]+ms)/)
  if (p99Match && metrics.httpReqDuration) {
    metrics.httpReqDuration.p99 = p99Match[1]
  }

  // Parse http_req_failed percentage
  const failedMatch = output.match(/http_req_failed[.\s]+:\s+([\d.]+)%/)
  if (failedMatch) {
    metrics.httpReqFailed = failedMatch[1] + "%"
  }

  // Parse total http_reqs
  const reqsMatch = output.match(/http_reqs[.\s]+:\s+(\d+)/)
  if (reqsMatch) {
    metrics.httpReqs = reqsMatch[1]
  }

  // Parse http_reqs rate
  const rateMatch = output.match(/http_reqs[.\s]+:\s+\d+\s+([\d.]+\/s)/)
  if (rateMatch) {
    metrics.httpReqsRate = rateMatch[1]
  }

  // Parse iterations
  const iterMatch = output.match(/iterations[.\s]+:\s+(\d+)/)
  if (iterMatch) {
    metrics.iterations = iterMatch[1]
  }

  // Parse VUs
  const vusMatch = output.match(/vus[.\s]+:\s+(\d+)/)
  const vusMaxMatch = output.match(/vus_max[.\s]+:\s+(\d+)/)
  if (vusMatch) {
    metrics.vus = vusMatch[1]
  }
  if (vusMaxMatch) {
    metrics.vusMax = vusMaxMatch[1]
  }

  return metrics
}

/**
 * Generate markdown summary from metrics
 */
function generateMarkdownSummary(metrics: Partial<K6Metrics>, testName: string): string {
  const duration = metrics.httpReqDuration

  return `
### ${testName} Results

**Throughput:**
- Requests per second: ${metrics.httpReqsRate || "N/A"}
- Total requests: ${metrics.httpReqs || "N/A"}
- Failed requests: ${metrics.httpReqFailed || "N/A"}

**Response Times:**
- **Min:** ${duration?.min || "N/A"}
- **Avg:** ${duration?.avg || "N/A"}
- **Median (p50):** ${duration?.med || "N/A"}
- **p90:** ${duration?.p90 || "N/A"}
- **p95:** ${duration?.p95 || "N/A"}
- **p99:** ${duration?.p99 || "N/A"}
- **Max:** ${duration?.max || "N/A"}

**Error Rate:**
- Success rate: ${metrics.checks || "N/A"}
- Error rate: ${metrics.httpReqFailed || "N/A"}

**Load:**
- Virtual Users: ${metrics.vus || "N/A"} (max: ${metrics.vusMax || "N/A"})
- Iterations: ${metrics.iterations || "N/A"}
`.trim()
}

/**
 * Evaluate if metrics meet expected thresholds
 */
function evaluateThresholds(
  metrics: Partial<K6Metrics>,
  testType: "smoke" | "load" | "sustained" | "spike"
): {
  pass: boolean
  issues: string[]
} {
  const issues: string[] = []

  // Parse numeric values
  const p95 = parseFloat(metrics.httpReqDuration?.p95 || "0")
  const errorRate = parseFloat(metrics.httpReqFailed || "0")
  const successRate = parseFloat(metrics.checks || "0")

  // Define thresholds based on test type
  const thresholds = {
    smoke: {
      p95Max: 1000,
      errorRateMax: 1,
      successRateMin: 99,
    },
    load: {
      p95Max: 500,
      errorRateMax: 5,
      successRateMin: 95,
    },
    sustained: {
      p95Max: 500,
      errorRateMax: 5,
      successRateMin: 95,
    },
    spike: {
      p95Max: 2000, // More lenient during spike
      errorRateMax: 10,
      successRateMin: 90,
    },
  }

  const threshold = thresholds[testType]

  // Check p95 latency
  if (p95 > threshold.p95Max) {
    issues.push(`p95 latency (${p95}ms) exceeds threshold (${threshold.p95Max}ms)`)
  }

  // Check error rate
  if (errorRate > threshold.errorRateMax) {
    issues.push(`Error rate (${errorRate}%) exceeds threshold (${threshold.errorRateMax}%)`)
  }

  // Check success rate
  if (successRate < threshold.successRateMin) {
    issues.push(`Success rate (${successRate}%) below threshold (${threshold.successRateMin}%)`)
  }

  return {
    pass: issues.length === 0,
    issues,
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error("Usage: node --import tsx scripts/analyze-load-test-results.ts <results-file> [test-type]")
    console.error("\nTest types: smoke, load, sustained, spike")
    console.error("\nExample:")
    console.error("  npm run test:load > results.txt")
    console.error("  node --import tsx scripts/analyze-load-test-results.ts results.txt load")
    process.exit(1)
  }

  const resultsFile = args[0]
  const testType = (args[1] || "load") as "smoke" | "load" | "sustained" | "spike"

  if (!fs.existsSync(resultsFile)) {
    console.error(`Error: File not found: ${resultsFile}`)
    process.exit(1)
  }

  console.log(`\n📊 Analyzing k6 load test results from: ${resultsFile}`)
  console.log(`Test type: ${testType}\n`)

  // Read and parse results
  const output = fs.readFileSync(resultsFile, "utf-8")
  const metrics = parseK6Output(output)

  // Generate summary
  const testName = testType.charAt(0).toUpperCase() + testType.slice(1) + " Test"
  const summary = generateMarkdownSummary(metrics, testName)

  console.log("═".repeat(60))
  console.log(summary)
  console.log("═".repeat(60))

  // Evaluate against thresholds
  const evaluation = evaluateThresholds(metrics, testType)

  console.log("\n📋 Threshold Evaluation:")
  if (evaluation.pass) {
    console.log("✅ All thresholds passed!")
  } else {
    console.log("❌ Some thresholds failed:")
    evaluation.issues.forEach((issue) => {
      console.log(`  - ${issue}`)
    })
  }

  // Save to baseline file
  const baselineFile = path.join(
    process.cwd(),
    "docs",
    "testing",
    `baseline-${testType}-${new Date().toISOString().split("T")[0]}.md`
  )
  fs.writeFileSync(baselineFile, summary)
  console.log(`\n💾 Summary saved to: ${baselineFile}`)

  // Exit with appropriate code
  process.exit(evaluation.pass ? 0 : 1)
}

main()

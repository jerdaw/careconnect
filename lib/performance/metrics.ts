/**
 * Performance Metrics Aggregation
 *
 * In-memory metrics store for development and testing.
 * Tracks p50, p95, p99 latencies, operation counts, and metadata.
 *
 * @module lib/performance/metrics
 */

import type { PerformanceMetadata } from "./tracker"

/**
 * Metric data point
 */
interface MetricDataPoint {
  durationMs: number
  timestamp: number
  metadata?: PerformanceMetadata
}

/**
 * Aggregated metrics for an operation
 */
export interface OperationMetrics {
  operation: string
  count: number
  min: number
  max: number
  mean: number
  p50: number
  p95: number
  p99: number
  recentSamples: number
}

/**
 * All metrics summary
 */
export interface MetricsSummary {
  operations: Record<string, OperationMetrics>
  totalOperations: number
  trackingSince: number
}

// In-memory metrics store (development only)
const metricsStore: Map<string, MetricDataPoint[]> = new Map()
const trackingStartTime = Date.now()

// Maximum samples to keep per operation (prevent memory bloat)
const MAX_SAMPLES_PER_OPERATION = 1000

// Retention window (10 minutes)
const RETENTION_WINDOW_MS = 10 * 60 * 1000

/**
 * Record a metric data point
 *
 * @param operation - Operation name (dot-notation)
 * @param durationMs - Duration in milliseconds
 * @param metadata - Optional metadata
 */
export function recordMetric(operation: string, durationMs: number, metadata?: PerformanceMetadata): void {
  // Don't store metrics in production unless explicitly enabled
  // Use process.env directly for better testability and to avoid server-only env variable access issues
  const isProduction = process.env.NODE_ENV === "production"
  const isTrackingEnabled = process.env.NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING === "true"

  if (isProduction && !isTrackingEnabled) {
    // In production, only log to external systems (Axiom, Sentry, etc.)
    // Do not store in memory unless tracking is explicitly enabled
    return
  }

  const dataPoints = metricsStore.get(operation) ?? []

  dataPoints.push({
    durationMs,
    timestamp: Date.now(),
    metadata,
  })

  // Prune old samples if needed
  if (dataPoints.length > MAX_SAMPLES_PER_OPERATION) {
    dataPoints.shift()
  }

  metricsStore.set(operation, dataPoints)
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0

  const index = Math.ceil((p / 100) * sortedValues.length) - 1
  return sortedValues[Math.max(0, index)] ?? 0
}

/**
 * Calculate aggregated metrics for an operation
 */
function calculateOperationMetrics(operation: string, dataPoints: MetricDataPoint[]): OperationMetrics {
  // Filter to recent samples within retention window
  const now = Date.now()
  const recentPoints = dataPoints.filter((dp) => now - dp.timestamp < RETENTION_WINDOW_MS)

  if (recentPoints.length === 0) {
    return {
      operation,
      count: 0,
      min: 0,
      max: 0,
      mean: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      recentSamples: 0,
    }
  }

  const durations = recentPoints.map((dp) => dp.durationMs).sort((a, b) => a - b)
  const sum = durations.reduce((acc, val) => acc + val, 0)

  return {
    operation,
    count: dataPoints.length, // Total count across all time
    min: Math.min(...durations),
    max: Math.max(...durations),
    mean: sum / durations.length,
    p50: percentile(durations, 50),
    p95: percentile(durations, 95),
    p99: percentile(durations, 99),
    recentSamples: recentPoints.length,
  }
}

/**
 * Get metrics for a specific operation
 *
 * @param operation - Operation name
 * @returns Aggregated metrics or null if no data
 */
export function getOperationMetrics(operation: string): OperationMetrics | null {
  const dataPoints = metricsStore.get(operation)

  if (!dataPoints || dataPoints.length === 0) {
    return null
  }

  return calculateOperationMetrics(operation, dataPoints)
}

/**
 * Get all metrics summary
 *
 * @returns Summary of all tracked operations
 */
export function getMetrics(): MetricsSummary {
  const operations: Record<string, OperationMetrics> = {}
  let totalOperations = 0

  for (const [operation, dataPoints] of metricsStore.entries()) {
    operations[operation] = calculateOperationMetrics(operation, dataPoints)
    totalOperations += dataPoints.length
  }

  return {
    operations,
    totalOperations,
    trackingSince: trackingStartTime,
  }
}

/**
 * Reset all metrics
 *
 * Useful for testing or starting fresh measurements
 */
export function resetMetrics(): void {
  metricsStore.clear()
}

/**
 * Get raw data points for an operation (for debugging)
 *
 * @param operation - Operation name
 * @param limit - Maximum number of recent samples to return
 * @returns Array of data points
 */
export function getRawDataPoints(operation: string, limit = 100): MetricDataPoint[] {
  const dataPoints = metricsStore.get(operation) ?? []
  return dataPoints.slice(-limit)
}

/**
 * Prune old data points beyond retention window
 *
 * Called periodically to prevent memory growth.
 * This function is called automatically during metric collection,
 * so explicit periodic pruning is not required.
 */
export function pruneOldMetrics(): void {
  const now = Date.now()

  for (const [operation, dataPoints] of metricsStore.entries()) {
    const recentPoints = dataPoints.filter((dp) => now - dp.timestamp < RETENTION_WINDOW_MS)

    if (recentPoints.length === 0) {
      metricsStore.delete(operation)
    } else {
      metricsStore.set(operation, recentPoints)
    }
  }
}

// Note: Auto-pruning is not needed as metrics are pruned during collection
// via the retention window filter in calculateOperationMetrics()

/**
 * Export metrics to Axiom (production only)
 * Called periodically via scheduled job
 *
 * @returns void
 */
export async function exportMetricsToAxiom(): Promise<void> {
  if (process.env.NODE_ENV !== "production") return

  try {
    const { sendPerformanceMetrics } = await import("@/lib/observability/axiom")
    const metrics = getMetrics()

    await sendPerformanceMetrics({
      totalOperations: metrics.totalOperations,
      trackingSince: metrics.trackingSince,
      operations: metrics.operations,
    })
  } catch {
    // Don't throw - metrics export is non-critical
    // Error will be logged by Axiom module
  }
}

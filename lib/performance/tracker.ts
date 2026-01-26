/**
 * Performance Tracking Utilities
 *
 * Lightweight wrapper around logger for tracking operation performance.
 * Enabled via NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING environment variable.
 *
 * Usage:
 *   const result = await trackPerformance('operation.name', async () => {
 *     return await someOperation();
 *   });
 *
 * @module lib/performance/tracker
 */

import { logger } from "@/lib/logger"
import { recordMetric } from "./metrics"

/**
 * Check if performance tracking is enabled
 */
export function isPerformanceTrackingEnabled(): boolean {
  // Use process.env directly for better testability and to avoid server-only env variable access issues
  const trackingEnabled = process.env.NEXT_PUBLIC_ENABLE_SEARCH_PERF_TRACKING === "true"
  const isDevelopment = process.env.NODE_ENV === "development"
  return trackingEnabled || isDevelopment
}

/**
 * Metadata for performance tracking
 */
export interface PerformanceMetadata {
  [key: string]: string | number | boolean | undefined
}

/**
 * Result of a tracked performance operation
 */
export interface PerformanceResult<T> {
  result: T
  durationMs: number
  metadata?: PerformanceMetadata
}

/**
 * Track the performance of an async operation
 *
 * @param operationName - Dot-notation name (e.g., 'search.total', 'search.dataLoad')
 * @param operation - Async function to track
 * @param metadata - Optional metadata to include in logs
 * @returns The result of the operation
 */
export async function trackPerformance<T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: PerformanceMetadata
): Promise<T> {
  if (!isPerformanceTrackingEnabled()) {
    return operation()
  }

  const startTime = performance.now()

  try {
    const result = await operation()
    const durationMs = performance.now() - startTime

    // Record in metrics store
    recordMetric(operationName, durationMs, metadata)

    // Log with structured data
    logger.info(`Performance: ${operationName}`, {
      operation: operationName,
      durationMs: Math.round(durationMs * 100) / 100,
      ...metadata,
    })

    return result
  } catch (error) {
    const durationMs = performance.now() - startTime

    logger.error(`Performance: ${operationName} (failed)`, {
      operation: operationName,
      durationMs: Math.round(durationMs * 100) / 100,
      error: error instanceof Error ? error.message : String(error),
      ...metadata,
    })

    throw error
  }
}

/**
 * Track the performance of a sync operation
 *
 * @param operationName - Dot-notation name
 * @param operation - Sync function to track
 * @param metadata - Optional metadata to include in logs
 * @returns The result of the operation
 */
export function trackPerformanceSync<T>(
  operationName: string,
  operation: () => T,
  metadata?: PerformanceMetadata
): T {
  if (!isPerformanceTrackingEnabled()) {
    return operation()
  }

  const startTime = performance.now()

  try {
    const result = operation()
    const durationMs = performance.now() - startTime

    // Record in metrics store
    recordMetric(operationName, durationMs, metadata)

    // Log with structured data
    logger.info(`Performance: ${operationName}`, {
      operation: operationName,
      durationMs: Math.round(durationMs * 100) / 100,
      ...metadata,
    })

    return result
  } catch (error) {
    const durationMs = performance.now() - startTime

    logger.error(`Performance: ${operationName} (failed)`, {
      operation: operationName,
      durationMs: Math.round(durationMs * 100) / 100,
      error: error instanceof Error ? error.message : String(error),
      ...metadata,
    })

    throw error
  }
}

/**
 * Create a performance timer that can be stopped manually
 *
 * Useful for tracking operations across multiple function calls
 *
 * @param operationName - Dot-notation name
 * @param metadata - Optional metadata to include in logs
 * @returns Stop function that completes the tracking
 */
export function createPerformanceTimer(
  operationName: string,
  metadata?: PerformanceMetadata
): () => void {
  if (!isPerformanceTrackingEnabled()) {
    return () => {
      /* no-op */
    }
  }

  const startTime = performance.now()

  return () => {
    const durationMs = performance.now() - startTime

    // Record in metrics store
    recordMetric(operationName, durationMs, metadata)

    // Log with structured data
    logger.info(`Performance: ${operationName}`, {
      operation: operationName,
      durationMs: Math.round(durationMs * 100) / 100,
      ...metadata,
    })
  }
}

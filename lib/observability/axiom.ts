/**
 * Axiom Observability Integration
 *
 * Sends structured logs, metrics, and events to Axiom for production monitoring.
 *
 * Features:
 * - Batched metric ingestion (every 60s)
 * - Circuit breaker event streaming (real-time)
 * - Error-resilient (failed ingestion doesn't crash app)
 * - Production-only (no-op in development)
 *
 * @see https://axiom.co/docs
 */

import { Axiom } from "@axiomhq/js"
import { env } from "@/lib/env"
import { logger } from "@/lib/logger"

// Singleton Axiom client
let axiomClient: Axiom | null = null

/**
 * Initialize Axiom client (lazy, production-only)
 */
function getAxiomClient(): Axiom | null {
  if (process.env.NODE_ENV !== "production") {
    return null // No-op in dev/staging
  }

  if (!env.AXIOM_TOKEN || !env.AXIOM_ORG_ID) {
    logger.warn("Axiom credentials missing, observability disabled", {
      component: "axiom",
    })
    return null
  }

  if (!axiomClient) {
    axiomClient = new Axiom({
      token: env.AXIOM_TOKEN,
      orgId: env.AXIOM_ORG_ID,
    })
    logger.info("Axiom client initialized", {
      dataset: env.AXIOM_DATASET,
      component: "axiom",
    })
  }

  return axiomClient
}

/**
 * Send events to Axiom dataset
 */
export async function ingestEvents(dataset: string, events: Record<string, unknown>[]): Promise<void> {
  const client = getAxiomClient()
  if (!client) return // No-op if not configured

  try {
    await client.ingest(dataset, events)
    logger.debug(`Ingested ${events.length} events to Axiom`, {
      dataset,
      component: "axiom",
    })
  } catch (error) {
    // Don't throw - metrics are non-critical, app should continue
    logger.error("Axiom ingestion failed", {
      error: error instanceof Error ? error.message : String(error),
      dataset,
      eventCount: events.length,
      component: "axiom",
    })
  }
}

/**
 * Send performance metrics to Axiom
 */
export async function sendPerformanceMetrics(metrics: Record<string, unknown>): Promise<void> {
  await ingestEvents(env.AXIOM_DATASET || "kingston-care-production", [
    {
      _time: new Date().toISOString(),
      type: "performance",
      ...metrics,
    },
  ])
}

/**
 * Send circuit breaker event to Axiom
 */
export async function sendCircuitBreakerEvent(event: {
  state: string
  previousState: string
  failureCount: number
  successCount: number
  failureRate: number
}): Promise<void> {
  await ingestEvents(env.AXIOM_DATASET || "kingston-care-production", [
    {
      _time: new Date().toISOString(),
      type: "circuit_breaker",
      severity: event.state === "OPEN" ? "CRITICAL" : "INFO",
      ...event,
    },
  ])
}

/**
 * Send health check result to Axiom
 */
export async function sendHealthCheck(healthData: Record<string, unknown>): Promise<void> {
  await ingestEvents(env.AXIOM_DATASET || "kingston-care-production", [
    {
      _time: new Date().toISOString(),
      type: "health_check",
      ...healthData,
    },
  ])
}

/**
 * Send API error to Axiom
 */
export async function sendApiError(error: {
  endpoint: string
  method: string
  statusCode: number
  errorMessage: string
  userId?: string
}): Promise<void> {
  await ingestEvents(env.AXIOM_DATASET || "kingston-care-production", [
    {
      _time: new Date().toISOString(),
      type: "api_error",
      severity: error.statusCode >= 500 ? "ERROR" : "WARN",
      ...error,
    },
  ])
}

/**
 * Flush any pending events (called on shutdown)
 */
export async function flushAxiom(): Promise<void> {
  const client = getAxiomClient()
  if (client) {
    await client.flush()
    logger.info("Axiom client flushed", { component: "axiom" })
  }
}

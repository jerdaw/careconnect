/**
 * Circuit Breaker Telemetry
 *
 * Handles logging and monitoring of circuit breaker events.
 *
 * @module lib/resilience/telemetry
 */

import { logger } from "@/lib/logger"
import { CircuitState } from "./circuit-breaker"

/**
 * Circuit breaker event types
 */
export enum CircuitBreakerEvent {
  STATE_TRANSITION = "STATE_TRANSITION",
  REQUEST_SUCCESS = "REQUEST_SUCCESS",
  REQUEST_FAILURE = "REQUEST_FAILURE",
  CIRCUIT_OPENED = "CIRCUIT_OPENED",
  CIRCUIT_CLOSED = "CIRCUIT_CLOSED",
  CIRCUIT_HALF_OPEN = "CIRCUIT_HALF_OPEN",
  FALLBACK_USED = "FALLBACK_USED",
}

/**
 * Circuit breaker event metadata
 */
interface CircuitBreakerEventData {
  circuitName: string
  event: CircuitBreakerEvent
  timestamp: number
  state?: CircuitState
  previousState?: CircuitState
  failureCount?: number
  successCount?: number
  failureRate?: number
  error?: string
  durationMs?: number
  [key: string]: any
}

/**
 * Log a circuit breaker event
 *
 * @param data - Event data to log
 */
export function logCircuitBreakerEvent(data: CircuitBreakerEventData): void {
  const { event, circuitName, ...metadata } = data

  switch (event) {
    case CircuitBreakerEvent.CIRCUIT_OPENED:
      logger.error(`Circuit breaker '${circuitName}' OPENED`, {
        event,
        ...metadata,
      })
      break

    case CircuitBreakerEvent.CIRCUIT_CLOSED:
      logger.info(`Circuit breaker '${circuitName}' CLOSED`, {
        event,
        ...metadata,
      })
      break

    case CircuitBreakerEvent.CIRCUIT_HALF_OPEN:
      logger.warn(`Circuit breaker '${circuitName}' HALF-OPEN`, {
        event,
        ...metadata,
      })
      break

    case CircuitBreakerEvent.FALLBACK_USED:
      logger.warn(`Circuit breaker '${circuitName}' fallback used`, {
        event,
        ...metadata,
      })
      break

    case CircuitBreakerEvent.REQUEST_FAILURE:
      logger.warn(`Circuit breaker '${circuitName}' request failed`, {
        event,
        ...metadata,
      })
      break

    case CircuitBreakerEvent.STATE_TRANSITION:
      logger.info(`Circuit breaker '${circuitName}' state transition`, {
        event,
        ...metadata,
      })
      break

    default:
      logger.info(`Circuit breaker '${circuitName}' event`, {
        event,
        ...metadata,
      })
  }
}

/**
 * Create a telemetry reporter for a circuit breaker
 *
 * @param circuitName - Name of the circuit
 * @returns Functions to report circuit breaker events
 */
export function createCircuitBreakerTelemetry(circuitName: string) {
  return {
    /**
     * Report circuit opened event
     */
    reportOpened: (failureCount: number, failureRate: number) => {
      const timestamp = Date.now()

      logCircuitBreakerEvent({
        circuitName,
        event: CircuitBreakerEvent.CIRCUIT_OPENED,
        timestamp,
        state: CircuitState.OPEN,
        failureCount,
        failureRate,
      })

      // Send to Axiom (production only, non-blocking)
      if (process.env.NODE_ENV === "production") {
        void import("@/lib/observability/axiom").then(({ sendCircuitBreakerEvent }) => {
          void sendCircuitBreakerEvent({
            state: CircuitState.OPEN,
            previousState: CircuitState.CLOSED,
            failureCount,
            successCount: 0,
            failureRate,
          })
        })

        // Send Slack alert (production only, non-blocking)
        void import("@/lib/integrations/slack").then(({ sendCircuitBreakerAlert }) => {
          void sendCircuitBreakerAlert({
            state: CircuitState.OPEN,
            previousState: CircuitState.CLOSED,
            failureCount,
            successCount: 0,
            failureRate,
            timestamp,
          })
        })
      }
    },

    /**
     * Report circuit closed event
     */
    reportClosed: () => {
      const timestamp = Date.now()

      logCircuitBreakerEvent({
        circuitName,
        event: CircuitBreakerEvent.CIRCUIT_CLOSED,
        timestamp,
        state: CircuitState.CLOSED,
      })

      // Send Slack recovery alert (production only, non-blocking, optional)
      if (process.env.NODE_ENV === "production") {
        void import("@/lib/integrations/slack").then(({ sendCircuitBreakerAlert }) => {
          void sendCircuitBreakerAlert({
            state: CircuitState.CLOSED,
            previousState: CircuitState.OPEN,
            failureCount: 0,
            successCount: 1,
            failureRate: 0,
            timestamp,
          })
        })
      }
    },

    /**
     * Report circuit half-open event
     */
    reportHalfOpen: () => {
      logCircuitBreakerEvent({
        circuitName,
        event: CircuitBreakerEvent.CIRCUIT_HALF_OPEN,
        timestamp: Date.now(),
        state: CircuitState.HALF_OPEN,
      })
    },

    /**
     * Report state transition
     */
    reportStateTransition: (
      from: CircuitState,
      to: CircuitState,
      stats?: { failureCount: number; successCount: number; failureRate: number }
    ) => {
      logCircuitBreakerEvent({
        circuitName,
        event: CircuitBreakerEvent.STATE_TRANSITION,
        timestamp: Date.now(),
        previousState: from,
        state: to,
      })

      // Send to Axiom (production only, non-blocking)
      if (process.env.NODE_ENV === "production" && stats) {
        void import("@/lib/observability/axiom").then(({ sendCircuitBreakerEvent }) => {
          void sendCircuitBreakerEvent({
            state: to,
            previousState: from,
            failureCount: stats.failureCount,
            successCount: stats.successCount,
            failureRate: stats.failureRate,
          })
        })
      }
    },

    /**
     * Report request success
     */
    reportSuccess: (durationMs: number) => {
      logCircuitBreakerEvent({
        circuitName,
        event: CircuitBreakerEvent.REQUEST_SUCCESS,
        timestamp: Date.now(),
        durationMs,
      })
    },

    /**
     * Report request failure
     */
    reportFailure: (error: string, durationMs: number) => {
      logCircuitBreakerEvent({
        circuitName,
        event: CircuitBreakerEvent.REQUEST_FAILURE,
        timestamp: Date.now(),
        error,
        durationMs,
      })
    },

    /**
     * Report fallback used
     */
    reportFallbackUsed: () => {
      logCircuitBreakerEvent({
        circuitName,
        event: CircuitBreakerEvent.FALLBACK_USED,
        timestamp: Date.now(),
      })
    },
  }
}

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
      logCircuitBreakerEvent({
        circuitName,
        event: CircuitBreakerEvent.CIRCUIT_OPENED,
        timestamp: Date.now(),
        state: CircuitState.OPEN,
        failureCount,
        failureRate,
      })
    },

    /**
     * Report circuit closed event
     */
    reportClosed: () => {
      logCircuitBreakerEvent({
        circuitName,
        event: CircuitBreakerEvent.CIRCUIT_CLOSED,
        timestamp: Date.now(),
        state: CircuitState.CLOSED,
      })
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
    reportStateTransition: (from: CircuitState, to: CircuitState) => {
      logCircuitBreakerEvent({
        circuitName,
        event: CircuitBreakerEvent.STATE_TRANSITION,
        timestamp: Date.now(),
        previousState: from,
        state: to,
      })
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

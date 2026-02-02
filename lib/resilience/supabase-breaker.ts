/**
 * Supabase Circuit Breaker Wrapper
 *
 * Provides circuit breaker protection for Supabase calls with automatic
 * fallback behavior when the circuit is open.
 *
 * @module lib/resilience/supabase-breaker
 */

import { CircuitBreaker, CircuitOpenError, CircuitState } from "./circuit-breaker"
import { logger } from "@/lib/logger"

/**
 * Circuit breaker statistics type
 */
export interface CircuitBreakerStats {
  state: CircuitState
  enabled: boolean
  failureCount: number
  successCount: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  failureRate: number
  nextAttemptTime: number | null
}

/**
 * Global Supabase circuit breaker instance
 */
let supabaseBreaker: CircuitBreaker | null = null

function getSupabaseBreaker(): CircuitBreaker {
  if (!supabaseBreaker) {
    // Fallback to defaults if env vars are not accessible (e.g. client-side or tests)
    const failureThreshold = process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD
      ? parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD, 10)
      : 3

    const timeout = process.env.CIRCUIT_BREAKER_TIMEOUT ? parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT, 10) : 30000

    const config = {
      name: "supabase",
      failureThreshold,
      failureRateThreshold: 0.5,
      timeout,
      halfOpenAttempts: 1,
      monitorWindow: 60000,
    }
    supabaseBreaker = new CircuitBreaker(config)
  }
  return supabaseBreaker
}

/**
 * Check if circuit breaker is enabled
 */
export function isCircuitBreakerEnabled(): boolean {
  // Use process.env directly to avoid T3 env validation errors in shared/client code
  return process.env.CIRCUIT_BREAKER_ENABLED !== "false"
}

/**
 * Execute a Supabase operation with circuit breaker protection
 *
 * @param operation - Supabase operation to execute
 * @param fallback - Optional fallback function to call when circuit is open
 * @returns Result from operation or fallback
 *
 * @example
 * ```ts
 * const result = await withCircuitBreaker(
 *   async () => await supabase.from('services').select('*'),
 *   async () => loadFromCache()
 * )
 * ```
 */
export async function withCircuitBreaker<T>(operation: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
  // If circuit breaker is disabled, execute directly
  if (!isCircuitBreakerEnabled()) {
    return operation()
  }

  const breaker = getSupabaseBreaker()

  try {
    return await breaker.execute(operation)
  } catch (error) {
    // If circuit is open and we have a fallback, use it
    if (error instanceof CircuitOpenError && fallback) {
      logger.warn("Circuit breaker open, using fallback", {
        circuit: "supabase",
        stats: breaker.getStats(),
      })
      return await fallback()
    }

    // Otherwise, rethrow the error
    throw error
  }
}

/**
 * Get current Supabase circuit breaker state
 */
export function getSupabaseBreakerState(): CircuitState {
  if (!isCircuitBreakerEnabled()) {
    return CircuitState.CLOSED
  }
  return getSupabaseBreaker().getState()
}

/**
 * Get Supabase circuit breaker statistics
 */
export function getSupabaseBreakerStats(): CircuitBreakerStats {
  if (!isCircuitBreakerEnabled()) {
    return {
      state: CircuitState.CLOSED,
      enabled: false,
      failureCount: 0,
      successCount: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      failureRate: 0,
      nextAttemptTime: null,
    }
  }

  return {
    ...getSupabaseBreaker().getStats(),
    enabled: true,
  }
}

/**
 * Reset the Supabase circuit breaker (for testing)
 */
export function resetSupabaseBreaker(): void {
  if (supabaseBreaker) {
    supabaseBreaker.reset()
  }
}

/**
 * Check if Supabase is available (circuit not open)
 */
export function isSupabaseAvailable(): boolean {
  if (!isCircuitBreakerEnabled()) {
    return true
  }

  const state = getSupabaseBreakerState()
  return state !== CircuitState.OPEN
}

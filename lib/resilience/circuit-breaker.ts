/**
 * Circuit Breaker Pattern Implementation
 *
 * Provides resilience against cascading failures by monitoring error rates
 * and temporarily blocking requests to failing services.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, requests are blocked (fast fail)
 * - HALF_OPEN: Testing if service has recovered
 *
 * @module lib/resilience/circuit-breaker
 */

import { logger } from "@/lib/logger"

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = "CLOSED", // Normal operation
  OPEN = "OPEN", // Blocking requests (fast fail)
  HALF_OPEN = "HALF_OPEN", // Testing recovery
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Number of consecutive failures before opening circuit */
  failureThreshold: number
  /** Failure rate threshold (0-1) before opening circuit */
  failureRateThreshold: number
  /** Time in ms to wait before attempting recovery (OPEN -> HALF_OPEN) */
  timeout: number
  /** Number of successful requests in HALF_OPEN before closing circuit */
  halfOpenAttempts: number
  /** Time window in ms for calculating failure rate */
  monitorWindow: number
  /** Name of the circuit (for logging) */
  name: string
}

/**
 * Request outcome stored in rolling window
 */
interface RequestOutcome {
  success: boolean
  timestamp: number
  durationMs?: number
  error?: string
}

/**
 * Circuit breaker error thrown when circuit is open
 */
export class CircuitOpenError extends Error {
  constructor(circuitName: string) {
    super(`Circuit breaker '${circuitName}' is OPEN - request blocked`)
    this.name = "CircuitOpenError"
  }
}

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CONFIG: Omit<CircuitBreakerConfig, "name"> = {
  failureThreshold: 3,
  failureRateThreshold: 0.5, // 50% error rate
  timeout: 30000, // 30 seconds
  halfOpenAttempts: 1,
  monitorWindow: 60000, // 60 seconds
}

/**
 * Circuit Breaker implementation
 *
 * Monitors request outcomes and automatically opens the circuit when
 * failure thresholds are exceeded, preventing cascading failures.
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount = 0
  private successCount = 0
  private nextAttemptTime = 0
  private requestHistory: RequestOutcome[] = []
  private readonly config: CircuitBreakerConfig

  constructor(config: Partial<CircuitBreakerConfig> & { name: string }) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    }

    logger.info(`Circuit breaker '${this.config.name}' initialized`, {
      config: this.config,
    })
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state
  }

  /**
   * Get circuit breaker statistics
   */
  getStats() {
    this.pruneOldRequests()

    const totalRequests = this.requestHistory.length
    const successfulRequests = this.requestHistory.filter((r) => r.success).length
    const failedRequests = totalRequests - successfulRequests
    const failureRate = totalRequests > 0 ? failedRequests / totalRequests : 0

    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests,
      successfulRequests,
      failedRequests,
      failureRate,
      nextAttemptTime: this.state === CircuitState.OPEN ? this.nextAttemptTime : null,
    }
  }

  /**
   * Execute an operation with circuit breaker protection
   *
   * @param operation - Async function to execute
   * @returns Result of the operation
   * @throws CircuitOpenError if circuit is open
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if timeout has elapsed
      if (Date.now() >= this.nextAttemptTime) {
        this.transitionTo(CircuitState.HALF_OPEN)
      } else {
        throw new CircuitOpenError(this.config.name)
      }
    }

    const startTime = performance.now()
    try {
      const result = await operation()
      const durationMs = performance.now() - startTime

      this.recordSuccess(durationMs)
      return result
    } catch (error) {
      const durationMs = performance.now() - startTime

      this.recordFailure(error instanceof Error ? error.message : String(error), durationMs)
      throw error
    }
  }

  /**
   * Record a successful request
   */
  private recordSuccess(durationMs: number): void {
    this.requestHistory.push({
      success: true,
      timestamp: Date.now(),
      durationMs,
    })

    this.pruneOldRequests()

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++

      logger.info(`Circuit breaker '${this.config.name}' half-open success`, {
        successCount: this.successCount,
        halfOpenAttempts: this.config.halfOpenAttempts,
      })

      // If enough successful requests, close the circuit
      if (this.successCount >= this.config.halfOpenAttempts) {
        this.transitionTo(CircuitState.CLOSED)
        this.successCount = 0
        this.failureCount = 0
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success
      this.failureCount = 0
    }
  }

  /**
   * Record a failed request
   */
  private recordFailure(error: string, durationMs: number): void {
    this.requestHistory.push({
      success: false,
      timestamp: Date.now(),
      durationMs,
      error,
    })

    this.pruneOldRequests()

    this.failureCount++

    logger.warn(`Circuit breaker '${this.config.name}' recorded failure`, {
      failureCount: this.failureCount,
      failureThreshold: this.config.failureThreshold,
      error,
    })

    // Check if we should open the circuit
    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open state reopens the circuit
      this.transitionTo(CircuitState.OPEN)
      this.successCount = 0
    } else if (this.state === CircuitState.CLOSED) {
      // Check consecutive failure threshold
      if (this.failureCount >= this.config.failureThreshold) {
        this.transitionTo(CircuitState.OPEN)
      } else {
        // Also check failure rate in sliding window
        const stats = this.getStats()
        if (
          stats.totalRequests >= this.config.failureThreshold &&
          stats.failureRate >= this.config.failureRateThreshold
        ) {
          this.transitionTo(CircuitState.OPEN)
        }
      }
    }
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state
    this.state = newState

    if (newState === CircuitState.OPEN) {
      this.nextAttemptTime = Date.now() + this.config.timeout
    }

    logger.info(`Circuit breaker '${this.config.name}' state transition`, {
      from: oldState,
      to: newState,
      failureCount: this.failureCount,
      stats: this.getStats(),
      nextAttemptTime: this.nextAttemptTime,
    })
  }

  /**
   * Remove requests older than the monitor window
   */
  private pruneOldRequests(): void {
    const cutoffTime = Date.now() - this.config.monitorWindow
    this.requestHistory = this.requestHistory.filter((r) => r.timestamp >= cutoffTime)
  }

  /**
   * Reset the circuit breaker to initial state (for testing)
   */
  reset(): void {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.successCount = 0
    this.nextAttemptTime = 0
    this.requestHistory = []

    logger.info(`Circuit breaker '${this.config.name}' manually reset`)
  }

  /**
   * Force open the circuit (for testing/maintenance)
   */
  forceOpen(): void {
    this.transitionTo(CircuitState.OPEN)
  }

  /**
   * Force close the circuit (for testing/maintenance)
   */
  forceClose(): void {
    this.transitionTo(CircuitState.CLOSED)
    this.failureCount = 0
    this.successCount = 0
  }
}

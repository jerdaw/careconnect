/**
 * Alert Throttling System
 *
 * Prevents alert fatigue by limiting alert frequency per event type.
 *
 * Strategy:
 * - Circuit OPEN: Max 1 alert per 10 minutes
 * - High error rate: Max 1 alert per 5 minutes
 * - Circuit CLOSED: Max 1 alert per hour (recovery confirmation)
 *
 * Uses in-memory store (serverless-safe, resets on redeploy).
 *
 * @module lib/observability/alert-throttle
 */

import { logger } from "@/lib/logger"

/**
 * Alert types that can be throttled
 */
export type AlertType = "circuit-open" | "circuit-closed" | "high-error-rate"

/**
 * Throttle state for a specific alert type
 */
interface AlertThrottle {
  lastSent: number // Timestamp of last alert sent
  count: number // Total alerts sent (lifetime)
}

/**
 * In-memory throttle store (per-instance, resets on server restart)
 */
const alertThrottles = new Map<AlertType, AlertThrottle>()

/**
 * Throttle windows in milliseconds
 */
const THROTTLE_WINDOWS: Record<AlertType, number> = {
  "circuit-open": 10 * 60 * 1000, // 10 minutes
  "circuit-closed": 60 * 60 * 1000, // 1 hour
  "high-error-rate": 5 * 60 * 1000, // 5 minutes
}

/**
 * Check if alert should be sent based on throttle rules
 *
 * @param alertType - Type of alert to check
 * @returns true if alert should be sent, false if throttled
 *
 * @example
 * ```typescript
 * if (shouldSendAlert('circuit-open')) {
 *   await sendSlackAlert(...)
 * }
 * ```
 */
export function shouldSendAlert(alertType: AlertType): boolean {
  const now = Date.now()
  const throttle = alertThrottles.get(alertType)
  const windowMs = THROTTLE_WINDOWS[alertType]

  // First alert of this type - always allow
  if (!throttle) {
    alertThrottles.set(alertType, {
      lastSent: now,
      count: 1,
    })

    logger.info("Alert allowed (first of type)", {
      component: "alert-throttle",
      alertType,
      throttleWindow: `${windowMs / 1000 / 60}min`,
    })
    return true
  }

  // Check if throttle window has expired
  const timeSinceLastAlert = now - throttle.lastSent

  if (timeSinceLastAlert >= windowMs) {
    // Window expired - allow alert
    throttle.lastSent = now
    throttle.count += 1

    logger.info("Alert allowed (throttle window expired)", {
      component: "alert-throttle",
      alertType,
      timeSinceLastMs: timeSinceLastAlert,
      totalAlertsSent: throttle.count,
      nextAllowedAt: new Date(now + windowMs).toISOString(),
    })
    return true
  }

  // Still within throttle window - block alert
  const remainingMs = windowMs - timeSinceLastAlert
  const nextAllowedAt = new Date(throttle.lastSent + windowMs)

  logger.warn("Alert throttled (spam prevention)", {
    component: "alert-throttle",
    alertType,
    timeSinceLastMs: timeSinceLastAlert,
    remainingMs,
    nextAllowedAt: nextAllowedAt.toISOString(),
    totalAlertsBlocked: "not tracked",
  })

  return false
}

/**
 * Reset throttle for a specific alert type
 *
 * Primarily for testing purposes.
 *
 * @param alertType - Alert type to reset
 */
export function resetThrottle(alertType: AlertType): void {
  alertThrottles.delete(alertType)

  logger.info("Alert throttle reset", {
    component: "alert-throttle",
    alertType,
  })
}

/**
 * Reset all throttles
 *
 * Primarily for testing purposes.
 */
export function resetAllThrottles(): void {
  alertThrottles.clear()

  logger.info("All alert throttles reset", {
    component: "alert-throttle",
  })
}

/**
 * Get current throttle status for debugging
 *
 * @returns Throttle status for all alert types
 */
export function getThrottleStatus(): Record<AlertType, AlertThrottle | null> {
  return {
    "circuit-open": alertThrottles.get("circuit-open") || null,
    "circuit-closed": alertThrottles.get("circuit-closed") || null,
    "high-error-rate": alertThrottles.get("high-error-rate") || null,
  }
}

/**
 * Get time until next alert is allowed
 *
 * @param alertType - Alert type to check
 * @returns Milliseconds until next alert allowed, or 0 if allowed now
 */
export function getTimeUntilNextAlert(alertType: AlertType): number {
  const throttle = alertThrottles.get(alertType)
  if (!throttle) {
    return 0 // No throttle - allowed immediately
  }

  const windowMs = THROTTLE_WINDOWS[alertType]
  const now = Date.now()
  const timeSinceLastAlert = now - throttle.lastSent

  if (timeSinceLastAlert >= windowMs) {
    return 0 // Window expired - allowed now
  }

  return windowMs - timeSinceLastAlert
}

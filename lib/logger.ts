/**
 * Centralized logging utility for HelpBridge.
 * Supports structured logging with global context, timers, and metadata.
 */

type LogLevel = "info" | "warn" | "error" | "debug"

export interface LogMeta {
  component?: string
  action?: string
  userId?: string
  sessionId?: string
  locale?: string
  duration?: number
  [key: string]: unknown
}

const isDev = process.env.NODE_ENV !== "production"

class Logger {
  private context: LogMeta = {}
  private timers: Map<string, number> = new Map()

  /**
   * Set global context shared by all log calls.
   */
  setContext(ctx: LogMeta): void {
    this.context = { ...this.context, ...ctx }
  }

  /**
   * Start a timer for performance measurement.
   */
  startTimer(label: string): void {
    this.timers.set(label, performance.now())
  }

  /**
   * End a timer and return duration in ms.
   */
  endTimer(label: string): number | undefined {
    const startTime = this.timers.get(label)
    if (startTime === undefined) return undefined

    this.timers.delete(label)
    return Math.round(performance.now() - startTime)
  }

  /**
   * Log informational messages.
   */
  info(message: string, meta?: LogMeta): void {
    this.log("info", message, meta)
  }

  /**
   * Log warning messages.
   */
  warn(message: string, meta?: LogMeta): void {
    this.log("warn", message, meta)
  }

  /**
   * Log error messages with optional Error object.
   */
  error(message: string, error?: Error | unknown, meta?: LogMeta): void {
    const errorInfo =
      error instanceof Error ? { errorName: error.name, errorMessage: error.message, stack: error.stack } : { error }

    this.log("error", message, { ...meta, ...errorInfo })
  }

  /**
   * Log debug messages (development only).
   */
  debug(message: string, meta?: LogMeta): void {
    if (isDev) {
      this.log("debug", message, meta)
    }
  }

  private log(level: LogLevel, message: string, meta?: LogMeta): void {
    const timestamp = new Date().toISOString()
    const logData = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...this.context,
      ...meta,
    }

    if (isDev) {
      const { level: l, message: msg, timestamp: _t, ...meta } = logData
      if (Object.keys(meta).length > 0) {
        console[level](`[${l}] ${msg}`, meta)
      } else {
        console[level](`[${l}] ${msg}`)
      }
    } else {
      // Production: In a real app we'd send to Axiom, Sentry, etc.
      // For now, consistent JSON logging to console
      console[level](JSON.stringify(logData))
    }
  }
}

export const logger = new Logger()

/**
 * Generate a unique error ID for support tickets.
 */
export function generateErrorId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `ERR-${timestamp}-${randomPart}`.toUpperCase()
}

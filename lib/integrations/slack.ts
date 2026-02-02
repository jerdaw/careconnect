/**
 * Slack Integration Module
 *
 * Sends notifications to Slack via incoming webhooks for critical system events.
 *
 * Features:
 * - Rich message formatting with Slack blocks
 * - Production-only (no-op in development)
 * - Error-resilient (failed sends don't crash app)
 * - Non-blocking (async without await in callers)
 *
 * @module lib/integrations/slack
 */

import { logger } from "@/lib/logger"
import { CircuitState } from "@/lib/resilience/circuit-breaker"

/**
 * Slack message block types
 */
export interface SlackBlock {
  type: "section" | "header" | "divider" | "actions"
  text?: {
    type: "mrkdwn" | "plain_text"
    text: string
  }
  fields?: Array<{
    type: "mrkdwn"
    text: string
  }>
  elements?: Array<{
    type: "button"
    text: {
      type: "plain_text"
      text: string
    }
    url: string
  }>
}

/**
 * Slack message payload
 */
export interface SlackMessage {
  text: string // Fallback text (required)
  blocks?: SlackBlock[]
}

/**
 * Circuit breaker event data for Slack alerts
 */
export interface CircuitBreakerEvent {
  state: CircuitState
  previousState: CircuitState
  failureCount: number
  successCount: number
  failureRate: number
  timestamp: number
}

/**
 * Get Slack webhook URL from environment
 */
function getSlackWebhookUrl(): string | null {
  // Check if running in production
  if (process.env.NODE_ENV !== "production") {
    return null
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL

  if (!webhookUrl) {
    logger.warn("Slack webhook URL not configured", {
      component: "slack",
      hint: "Set SLACK_WEBHOOK_URL environment variable",
    })
    return null
  }

  return webhookUrl
}

/**
 * Send a message to Slack webhook
 *
 * @param message - Slack message payload
 * @returns Promise<boolean> - Success/failure
 */
export async function sendSlackMessage(message: SlackMessage): Promise<boolean> {
  const webhookUrl = getSlackWebhookUrl()

  // No-op in development or if webhook not configured
  if (!webhookUrl) {
    logger.info("Slack alert skipped (not in production or webhook not configured)", {
      component: "slack",
      messagePreview: message.text.substring(0, 100),
    })
    return false
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      logger.error("Slack webhook returned error", {
        component: "slack",
        status: response.status,
        statusText: response.statusText,
      })
      return false
    }

    logger.info("Slack alert sent successfully", {
      component: "slack",
      messagePreview: message.text.substring(0, 100),
    })
    return true
  } catch (error) {
    // Don't throw - failed alerts shouldn't crash the app
    logger.error("Failed to send Slack alert", {
      component: "slack",
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

/**
 * Format circuit breaker event as Slack message
 */
function formatCircuitBreakerMessage(event: CircuitBreakerEvent): SlackMessage {
  const { state, previousState, failureCount, failureRate, timestamp } = event

  // Determine message color and emoji
  const isOpening = state === CircuitState.OPEN
  const isClosing = state === CircuitState.CLOSED && previousState !== CircuitState.CLOSED
  const emoji = isOpening ? "🚨" : isClosing ? "✅" : "⚠️"
  const stateLabel = {
    [CircuitState.OPEN]: "OPEN",
    [CircuitState.CLOSED]: "CLOSED",
    [CircuitState.HALF_OPEN]: "HALF_OPEN",
  }[state]

  // Build fallback text
  const fallbackText = isOpening
    ? `${emoji} Circuit Breaker OPEN - Database operations protected`
    : isClosing
      ? `${emoji} Circuit Breaker CLOSED - System recovered`
      : `${emoji} Circuit Breaker ${stateLabel}`

  // Get dashboard and runbook URLs
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"
  const dashboardUrl = `${baseUrl}/admin/observability`
  const runbookUrl =
    "https://github.com/yourusername/kingston-care-connect/blob/main/docs/runbooks/circuit-breaker-open.md"

  // Build rich Slack blocks
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} Circuit Breaker Alert`,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Status:*\n${stateLabel}`,
        },
        {
          type: "mrkdwn",
          text: `*Previous:*\n${previousState}`,
        },
        {
          type: "mrkdwn",
          text: `*Failure Rate:*\n${(failureRate * 100).toFixed(1)}%`,
        },
        {
          type: "mrkdwn",
          text: `*Failures:*\n${failureCount}`,
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: isOpening
          ? "⚠️ *Database operations are being protected.* Check the dashboard for details and follow the runbook for troubleshooting steps."
          : isClosing
            ? "✅ *System has recovered.* Normal operations have resumed."
            : "⚠️ *Circuit is testing recovery.* Monitoring in progress.",
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Time:*\n${new Date(timestamp).toLocaleString("en-US", { timeZone: "America/Toronto" })}`,
        },
      ],
    },
  ]

  // Add action buttons (only for OPEN state)
  if (isOpening) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "📊 View Dashboard",
          },
          url: dashboardUrl,
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "📖 View Runbook",
          },
          url: runbookUrl,
        },
      ],
    })
  }

  return {
    text: fallbackText,
    blocks,
  }
}

/**
 * Send circuit breaker alert to Slack
 *
 * @param event - Circuit breaker event data
 */
export async function sendCircuitBreakerAlert(event: CircuitBreakerEvent): Promise<void> {
  const message = formatCircuitBreakerMessage(event)
  await sendSlackMessage(message)
}

/**
 * Send high error rate alert to Slack
 *
 * @param errorRate - Current error rate percentage (0-100)
 * @param threshold - Threshold that was exceeded
 */
export async function sendHighErrorRateAlert(errorRate: number, threshold: number): Promise<void> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"
  const dashboardUrl = `${baseUrl}/admin/observability`

  const message: SlackMessage = {
    text: `⚠️ High Error Rate Alert - ${errorRate.toFixed(1)}% (threshold: ${threshold}%)`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "⚠️ High Error Rate Alert",
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Error Rate:*\n${errorRate.toFixed(1)}%`,
          },
          {
            type: "mrkdwn",
            text: `*Threshold:*\n${threshold}%`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "⚠️ *Error rate is elevated.* This is an early warning signal. Check the dashboard to identify failing operations.",
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "📊 View Dashboard",
            },
            url: dashboardUrl,
          },
        ],
      },
    ],
  }

  await sendSlackMessage(message)
}

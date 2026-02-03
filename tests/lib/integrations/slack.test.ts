import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { sendSlackMessage, sendCircuitBreakerAlert, sendHighErrorRateAlert } from "@/lib/integrations/slack"
import { CircuitState } from "@/lib/resilience/circuit-breaker"
import { resetAllThrottles } from "@/lib/observability/alert-throttle"

// Mock fetch globally
global.fetch = vi.fn()

describe("Slack Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset all alert throttles between tests
    resetAllThrottles()
    // Set production environment for tests
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("SLACK_WEBHOOK_URL", "https://hooks.slack.com/services/TEST/WEBHOOK/URL")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe("sendSlackMessage", () => {
    it("sends message to webhook URL successfully", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
      } as Response)

      const result = await sendSlackMessage({
        text: "Test message",
      })

      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        "https://hooks.slack.com/services/TEST/WEBHOOK/URL",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining("Test message"),
        })
      )
    })

    it("handles network errors gracefully", async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"))

      const result = await sendSlackMessage({ text: "Test" })

      expect(result).toBe(false)
      // Should not throw
    })

    it("handles non-200 responses", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response)

      const result = await sendSlackMessage({ text: "Test" })

      expect(result).toBe(false)
    })

    it("returns false in development environment", async () => {
      vi.stubEnv("NODE_ENV", "development")

      const result = await sendSlackMessage({ text: "Test" })

      expect(result).toBe(false)
      expect(fetch).not.toHaveBeenCalled()
    })

    it("returns false when webhook URL not configured", async () => {
      vi.stubEnv("SLACK_WEBHOOK_URL", "")

      const result = await sendSlackMessage({ text: "Test" })

      expect(result).toBe(false)
      expect(fetch).not.toHaveBeenCalled()
    })

    it("sends message with Slack blocks", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response)

      await sendSlackMessage({
        text: "Fallback text",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "Test Header",
            },
          },
        ],
      })

      const calls = vi.mocked(fetch).mock.calls
      expect(calls.length).toBeGreaterThan(0)

      const call = calls[0]
      if (!call || !call[1]?.body) {
        throw new Error("No fetch call found")
      }

      const body = JSON.parse(call[1].body as string) as Record<string, any>
      expect(body.text).toBe("Fallback text")
      expect(body.blocks).toHaveLength(1)
      expect(body.blocks[0].type).toBe("header")
    })
  })

  describe("sendCircuitBreakerAlert", () => {
    it("formats and sends circuit OPEN alert", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response)

      await sendCircuitBreakerAlert({
        state: CircuitState.OPEN,
        previousState: CircuitState.CLOSED,
        failureCount: 5,
        successCount: 0,
        failureRate: 0.75,
        timestamp: Date.now(),
      })

      const calls = vi.mocked(fetch).mock.calls
      expect(calls.length).toBeGreaterThan(0)

      const call = calls[0]
      if (!call || !call[1]?.body) {
        throw new Error("No fetch call found")
      }

      const body = JSON.parse(call[1].body as string) as Record<string, any>
      expect(body.text).toContain("Circuit Breaker OPEN")
      expect(body.text).toContain("🚨")
      expect(body.blocks).toBeDefined()
      expect(body.blocks[0].type).toBe("header")
    })

    it("formats and sends circuit CLOSED alert", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response)

      await sendCircuitBreakerAlert({
        state: CircuitState.CLOSED,
        previousState: CircuitState.OPEN,
        failureCount: 0,
        successCount: 1,
        failureRate: 0,
        timestamp: Date.now(),
      })

      const calls = vi.mocked(fetch).mock.calls
      expect(calls.length).toBeGreaterThan(0)

      const call = calls[0]
      if (!call || !call[1]?.body) {
        throw new Error("No fetch call found")
      }

      const body = JSON.parse(call[1].body as string) as Record<string, any>
      expect(body.text).toContain("Circuit Breaker CLOSED")
      expect(body.text).toContain("✅")
      expect(body.blocks).toBeDefined()
    })

    it("includes dashboard and runbook links for OPEN state", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response)

      await sendCircuitBreakerAlert({
        state: CircuitState.OPEN,
        previousState: CircuitState.CLOSED,
        failureCount: 3,
        successCount: 0,
        failureRate: 0.5,
        timestamp: Date.now(),
      })

      const calls = vi.mocked(fetch).mock.calls
      expect(calls.length).toBeGreaterThan(0)

      const call = calls[0]
      if (!call || !call[1]?.body) {
        throw new Error("No fetch call found")
      }

      const body = JSON.parse(call[1].body as string) as Record<string, any>

      // Find actions block
      const actionsBlock = body.blocks.find((b: any) => b.type === "actions")
      expect(actionsBlock).toBeDefined()
      expect(actionsBlock.elements).toHaveLength(2)
      expect(actionsBlock.elements[0].text.text).toContain("Dashboard")
      expect(actionsBlock.elements[1].text.text).toContain("Runbook")
    })

    it("includes failure metrics in message", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response)

      await sendCircuitBreakerAlert({
        state: CircuitState.OPEN,
        previousState: CircuitState.CLOSED,
        failureCount: 7,
        successCount: 0,
        failureRate: 0.85,
        timestamp: Date.now(),
      })

      const calls = vi.mocked(fetch).mock.calls
      expect(calls.length).toBeGreaterThan(0)

      const call = calls[0]
      if (!call || !call[1]?.body) {
        throw new Error("No fetch call found")
      }

      const body = JSON.parse(call[1].body as string) as Record<string, any>

      // Check fields section
      const fieldsBlock = body.blocks.find((b: any) => b.type === "section" && b.fields)
      expect(fieldsBlock).toBeDefined()
      const hasFailureRate = fieldsBlock.fields.some((f: any) => f.text.includes("85.0%"))
      const hasFailureCount = fieldsBlock.fields.some((f: any) => f.text.includes("7"))
      expect(hasFailureRate).toBe(true)
      expect(hasFailureCount).toBe(true)
    })
  })

  describe("sendHighErrorRateAlert", () => {
    it("formats and sends high error rate alert", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response)

      await sendHighErrorRateAlert(15.5, 10)

      const calls = vi.mocked(fetch).mock.calls
      expect(calls.length).toBeGreaterThan(0)

      const call = calls[0]
      if (!call || !call[1]?.body) {
        throw new Error("No fetch call found")
      }

      const body = JSON.parse(call[1].body as string) as Record<string, any>
      expect(body.text).toContain("High Error Rate Alert")
      expect(body.text).toContain("15.5%")
      expect(body.blocks).toBeDefined()
    })

    it("includes error rate and threshold", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response)

      await sendHighErrorRateAlert(25.8, 20)

      const calls = vi.mocked(fetch).mock.calls
      expect(calls.length).toBeGreaterThan(0)

      const call = calls[0]
      if (!call || !call[1]?.body) {
        throw new Error("No fetch call found")
      }

      const body = JSON.parse(call[1].body as string) as Record<string, any>

      const fieldsBlock = body.blocks.find((b: any) => b.type === "section" && b.fields)
      const hasErrorRate = fieldsBlock.fields.some((f: any) => f.text.includes("25.8%"))
      const hasThreshold = fieldsBlock.fields.some((f: any) => f.text.includes("20%"))
      expect(hasErrorRate).toBe(true)
      expect(hasThreshold).toBe(true)
    })
  })
})

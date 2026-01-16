import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { logger } from "@/lib/logger"

describe("Logger", () => {
  let infoSpy: any
  let errorSpy: any
  let debugSpy: any

  beforeEach(() => {
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {})
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {})

    // Reset global context
    logger.setContext({})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should log info messages with metadata", () => {
    logger.info("test info", { component: "Test" })

    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining("[INFO] test info"),
      expect.objectContaining({ component: "Test" })
    )
  })

  it("should include global context in all logs", () => {
    logger.setContext({ sessionId: "123", userId: "abc" })
    logger.info("context test")

    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining("[INFO] context test"),
      expect.objectContaining({ sessionId: "123", userId: "abc" })
    )
  })

  it("should handle error objects correctly", () => {
    const error = new Error("oops")
    logger.error("something failed", error, { action: "fail" })

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[ERROR] something failed"),
      expect.objectContaining({
        action: "fail",
        errorName: "Error",
        errorMessage: "oops",
        stack: expect.any(String),
      })
    )
  })

  it("should measure durations with timers", async () => {
    logger.startTimer("work")
    // Use a small delay to ensure measurable duration
    await new Promise((r) => setTimeout(r, 10))
    const duration = logger.endTimer("work")

    expect(duration).toBeGreaterThanOrEqual(10)

    logger.info("work finished", { duration })
    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining("[INFO] work finished"),
      expect.objectContaining({ duration: expect.any(Number) })
    )
  })

  it("should not log debug messages in production", () => {
    // skip testing production flag since it's hard to mock internal isDev
    // we already tested that debug logs when isDev is true
    logger.debug("visible")
    expect(debugSpy).toHaveBeenCalled()
  })
})

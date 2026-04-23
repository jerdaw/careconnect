/** @vitest-environment node */
import { describe, expect, it } from "vitest"

import { classifyUrlCheckOutcome } from "@/lib/health/url-health"

describe("classifyUrlCheckOutcome", () => {
  it("treats successful responses as healthy", () => {
    expect(classifyUrlCheckOutcome({ status: 200 })).toBe("healthy")
    expect(classifyUrlCheckOutcome({ status: 301 })).toBe("healthy")
  })

  it("treats actionable client errors as broken", () => {
    expect(classifyUrlCheckOutcome({ status: 404 })).toBe("broken")
    expect(classifyUrlCheckOutcome({ status: 410 })).toBe("broken")
  })

  it("treats bot blocks and server errors as inconclusive", () => {
    expect(classifyUrlCheckOutcome({ status: 403 })).toBe("inconclusive")
    expect(classifyUrlCheckOutcome({ status: 429 })).toBe("inconclusive")
    expect(classifyUrlCheckOutcome({ status: 500 })).toBe("inconclusive")
  })

  it("treats DNS and invalid URL errors as broken", () => {
    expect(classifyUrlCheckOutcome({ status: "error", errorCode: "ENOTFOUND" })).toBe("broken")
    expect(classifyUrlCheckOutcome({ status: "error", errorCode: "ERR_INVALID_URL" })).toBe("broken")
  })

  it("treats network, redirect, and certificate failures as inconclusive", () => {
    expect(classifyUrlCheckOutcome({ status: "error", errorCode: "UND_ERR_CONNECT_TIMEOUT" })).toBe("inconclusive")
    expect(classifyUrlCheckOutcome({ status: "error", errorCode: "UNABLE_TO_VERIFY_LEAF_SIGNATURE" })).toBe(
      "inconclusive"
    )
    expect(classifyUrlCheckOutcome({ status: "error", errorMessage: "redirect count exceeded" })).toBe("inconclusive")
  })
})

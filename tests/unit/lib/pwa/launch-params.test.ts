import { describe, it, expect } from "vitest"
import { parsePwaLaunchParams } from "@/lib/pwa/launch-params"
import { IntentCategory } from "@/types/service"

describe("parsePwaLaunchParams", () => {
  it("parses query, category, and openNow", () => {
    const params = new URLSearchParams("q=food&category=Crisis&openNow=1")
    expect(parsePwaLaunchParams(params)).toEqual({
      query: "food",
      category: IntentCategory.Crisis,
      openNow: true,
    })
  })

  it("parses category case-insensitively", () => {
    const params = new URLSearchParams("category=crisis")
    expect(parsePwaLaunchParams(params).category).toBe(IntentCategory.Crisis)
  })

  it("ignores invalid category values", () => {
    const params = new URLSearchParams("category=NotARealCategory")
    expect(parsePwaLaunchParams(params).category).toBeNull()
  })

  it("parses openNow false values", () => {
    const params = new URLSearchParams("openNow=0")
    expect(parsePwaLaunchParams(params).openNow).toBe(false)
  })
})

import { describe, expect, it } from "vitest"

import { buildMatchReasonSearchParams, normalizeMatchReasons, splitMatchReasons } from "@/lib/search/match-reasons"

describe("match reason helpers", () => {
  it("trims whitespace and deduplicates reasons case-insensitively", () => {
    expect(
      normalizeMatchReasons([
        " Fresh Data Boost (+10%) ",
        "Semantic Boost (87%)",
        "",
        "semantic   boost (87%)",
        "Authority Boost (+20%)",
      ])
    ).toEqual(["Fresh Data Boost (+10%)", "Semantic Boost (87%)", "Authority Boost (+20%)"])
  })

  it("splits preview and hidden reasons while preserving order", () => {
    expect(splitMatchReasons(["One", "Two", "Three"], 2)).toEqual({
      all: ["One", "Two", "Three"],
      preview: ["One", "Two"],
      hidden: ["Three"],
    })
  })

  it("builds repeated search params for normalized reasons", () => {
    expect(buildMatchReasonSearchParams([" Fresh Data Boost (+10%) ", "Semantic Boost (87%)"]).toString()).toBe(
      "matchReason=Fresh+Data+Boost+%28%2B10%25%29&matchReason=Semantic+Boost+%2887%25%29"
    )
  })
})

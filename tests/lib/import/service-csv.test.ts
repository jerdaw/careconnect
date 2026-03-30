import { describe, expect, it } from "vitest"
import { parseServiceImportCSV } from "@/lib/import/service-csv"

describe("parseServiceImportCSV", () => {
  it("parses quoted commas, escaped quotes, and multiline fields", () => {
    const rows = parseServiceImportCSV(
      [
        "name,description,intent_category,url",
        '"Community Pantry","Food, pantry and ""fresh"" produce","Food","https://example.com"',
        '"Warm Line","First line',
        'Second line","Crisis","https://example.com/warm-line"',
      ].join("\n")
    )

    expect(rows).toEqual([
      {
        name: "Community Pantry",
        description: 'Food, pantry and "fresh" produce',
        intent_category: "Food",
        url: "https://example.com",
      },
      {
        name: "Warm Line",
        description: "First line\nSecond line",
        intent_category: "Crisis",
        url: "https://example.com/warm-line",
      },
    ])
  })

  it("throws when rows have a mismatched field count", () => {
    expect(() =>
      parseServiceImportCSV(
        ["name,description,intent_category,url", '"Broken Row","Missing category and URL"'].join("\n")
      )
    ).toThrow(/Too few fields/i)
  })
})

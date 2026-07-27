/** @vitest-environment node */
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import servicesJson from "@/data/services.json"
import { routing } from "@/i18n/routing"
import { serviceServesPlace } from "@/lib/places/coverage"
import { DEFAULT_PLACE_ID } from "@/lib/places/selection"
import type { Service } from "@/types/service"

const EXPECTED_INVENTORY_SERVICES = 204
const EXPECTED_DEFAULT_PLACE_SERVICES = 196
const EXPECTED_BRAMPTON_ONLY_SERVICES = 8
const EXPECTED_CATEGORIES = 12
const EXPECTED_LANGUAGES = 7

describe("public inventory counts", () => {
  it("distinguishes the full inventory from default-place coverage", () => {
    const services = servicesJson as unknown as Service[]
    const defaultPlaceCount = services.filter((service) => serviceServesPlace(service, DEFAULT_PLACE_ID)).length
    const bramptonOnlyCount = services.filter(
      (service) => service.primary_place_id === "brampton-on" && !serviceServesPlace(service, DEFAULT_PLACE_ID)
    ).length
    const categoryCount = new Set(services.map((service) => service.intent_category)).size
    const readme = readFileSync(path.join(process.cwd(), "README.md"), "utf8")

    expect(services).toHaveLength(EXPECTED_INVENTORY_SERVICES)
    expect(defaultPlaceCount).toBe(EXPECTED_DEFAULT_PLACE_SERVICES)
    expect(bramptonOnlyCount).toBe(EXPECTED_BRAMPTON_ONLY_SERVICES)
    expect(categoryCount).toBe(EXPECTED_CATEGORIES)
    expect(routing.locales).toHaveLength(EXPECTED_LANGUAGES)
    expect(readme).toContain("**204 manually curated records**")
    expect(readme).toContain("196 cover Kingston and 8 are Brampton-only")
    expect(readme).not.toContain("196 highest-impact services")

    for (const locale of routing.locales) {
      const messages = JSON.parse(readFileSync(path.join(process.cwd(), "messages", `${locale}.json`), "utf8")) as {
        Home: {
          stats: {
            servicesValue: string
            categoriesValue: string
            languagesValue: string
          }
        }
      }

      expect(messages.Home.stats).toMatchObject({
        servicesValue: String(EXPECTED_INVENTORY_SERVICES),
        categoriesValue: String(EXPECTED_CATEGORIES),
        languagesValue: String(EXPECTED_LANGUAGES),
      })
    }
  })
})

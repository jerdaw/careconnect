import { describe, expect, it } from "vitest"
import ar from "@/messages/ar.json"
import en from "@/messages/en.json"
import es from "@/messages/es.json"
import fr from "@/messages/fr.json"
import pa from "@/messages/pa.json"
import pt from "@/messages/pt.json"
import zhHans from "@/messages/zh-Hans.json"

const localeMessages = { ar, en, es, fr, pa, pt, "zh-Hans": zhHans }
const requiredKeys = Object.keys(en.Retirement).sort()

describe("retirement translations", () => {
  it.each(Object.entries(localeMessages))("provides complete non-empty %s copy", (_locale, messages) => {
    expect(Object.keys(messages.Retirement).sort()).toEqual(requiredKeys)

    for (const value of Object.values(messages.Retirement)) {
      expect(value.trim()).not.toBe("")
    }
  })

  it("does not present the retirement surface as an active directory in English", () => {
    expect(en.Retirement.description).toContain("not an active directory")
    expect(en.Retirement.boundary).toContain("does not list, verify, or endorse")
  })
})

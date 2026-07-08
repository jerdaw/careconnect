import { describe, expect, it } from "vitest"
import { getHeroPlaces, getPlaceById, SUPPORTED_PLACES } from "@/lib/places/registry"

describe("place registry", () => {
  it("contains Kingston and Brampton with stable IDs", () => {
    expect(getPlaceById("kingston-on")?.name).toBe("Kingston")
    expect(getPlaceById("brampton-on")?.name).toBe("Brampton")
  })

  it("uses only live or preview places for the homepage hero", () => {
    const heroIds = getHeroPlaces().map((place) => place.id)

    expect(heroIds).toContain("kingston-on")
    expect(heroIds).toContain("brampton-on")
    expect(getHeroPlaces().every((place) => place.status === "live" || place.status === "preview")).toBe(true)
  })

  it("keeps registry IDs unique", () => {
    const ids = SUPPORTED_PLACES.map((place) => place.id)

    expect(new Set(ids).size).toBe(ids.length)
  })
})

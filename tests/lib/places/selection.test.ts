import { describe, expect, it } from "vitest"
import {
  getDefaultPlaceId,
  getSelectedPlaceLabel,
  inferPlaceFromCoordinates,
  normalizeSelectedPlace,
} from "@/lib/places/selection"

describe("place selection helpers", () => {
  it("normalizes unknown stored values to the default place", () => {
    expect(getDefaultPlaceId()).toBe("kingston-on")
    expect(normalizeSelectedPlace("brampton-on")).toBe("brampton-on")
    expect(normalizeSelectedPlace("unknown")).toBe("kingston-on")
    expect(normalizeSelectedPlace(null)).toBe("kingston-on")
  })

  it("infers a supported place from coordinates inside known bounds", () => {
    expect(inferPlaceFromCoordinates({ lat: 43.7315, lng: -79.7624 })).toBe("brampton-on")
    expect(inferPlaceFromCoordinates({ lat: 44.2312, lng: -76.486 })).toBe("kingston-on")
    expect(inferPlaceFromCoordinates({ lat: 45.4215, lng: -75.6972 })).toBeNull()
  })

  it("returns a readable selected-place label", () => {
    expect(getSelectedPlaceLabel("kingston-on")).toBe("Kingston")
    expect(getSelectedPlaceLabel("brampton-on")).toBe("Brampton")
  })
})

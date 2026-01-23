import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { isOpenNow } from "@/lib/search/hours"
import { ServiceHours } from "@/types/service"

describe("isOpenNow", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const mockHours: ServiceHours = {
    monday: { open: "09:00", close: "17:00" },
    tuesday: { open: "13:00", close: "21:00" },
    wednesday: "By appointment only" as any, // Cast to test defensive logic
    thursday: { open: "22:00", close: "02:00" }, // Overnight
    friday: null as any,
  }

  it("should return false if no hours provided", () => {
    expect(isOpenNow(undefined)).toBe(false)
  })

  it("should return true when within standard hours", () => {
    // Set time to Monday 10:00 AM
    const monday = new Date(2024, 0, 1, 10, 0, 0) // Jan 1 2024 was a Monday
    vi.setSystemTime(monday)

    expect(isOpenNow(mockHours)).toBe(true)
  })

  it("should return false when before opening", () => {
    // Monday 8:00 AM
    const mondayMorning = new Date(2024, 0, 1, 8, 0, 0)
    vi.setSystemTime(mondayMorning)
    expect(isOpenNow(mockHours)).toBe(false)
  })

  it("should return false when after closing", () => {
    // Monday 6:00 PM
    const mondayEvening = new Date(2024, 0, 1, 18, 0, 0)
    vi.setSystemTime(mondayEvening)
    expect(isOpenNow(mockHours)).toBe(false)
  })

  it("should return false for text-only hours (notes)", () => {
    // Wednesday is "By appointment only"
    const wednesday = new Date(2024, 0, 3, 12, 0, 0)
    vi.setSystemTime(wednesday)
    expect(isOpenNow(mockHours)).toBe(false)
  })

  it("should handle overnight hours correctly (before midnight)", () => {
    // Thursday 11:00 PM -> Open (22:00 - 02:00)
    const thursdayNight = new Date(2024, 0, 4, 23, 0, 0)
    vi.setSystemTime(thursdayNight)
    expect(isOpenNow(mockHours)).toBe(true)
  })

  it("should handle overnight hours correctly (after midnight)", () => {
    // Friday 1:00 AM should be open due to Thursday's overnight hours (22:00 - 02:00).
    const fridayEarly = new Date(2024, 0, 5, 1, 0, 0)
    vi.setSystemTime(fridayEarly)
    expect(isOpenNow(mockHours)).toBe(true)
  })

  it("should not treat early morning as open for the same day's overnight schedule", () => {
    // Thursday 1:00 AM is BEFORE Thursday's opening time (22:00), so it should not be open.
    // (If anything, that time window belongs to Wednesday's overnight hours, if present.)
    const thursdayEarly = new Date(2024, 0, 4, 1, 0, 0)
    vi.setSystemTime(thursdayEarly)
    expect(isOpenNow(mockHours)).toBe(false)
  })

  it("should return true for 24-hour service (00:00 - 23:59)", () => {
    const hours24: ServiceHours = {
      monday: { open: "00:00", close: "23:59" },
    }

    // Check various times
    const times = [
      new Date(2024, 0, 1, 0, 0, 0), // Midnight start
      new Date(2024, 0, 1, 12, 0, 0), // Noon
      new Date(2024, 0, 1, 23, 58, 0), // One minute before close
    ] // Monday

    times.forEach((t) => {
      vi.setSystemTime(t)
      expect(isOpenNow(hours24)).toBe(true)
    })
  })

  it("should return false (safely) if hours data is incomplete", () => {
    const corruptHours: any = {
      monday: { open: "09:00" }, // Missing close
    }
    const monday = new Date(2024, 0, 1, 10, 0, 0)
    vi.setSystemTime(monday)

    expect(isOpenNow(corruptHours)).toBe(false)
  })
})

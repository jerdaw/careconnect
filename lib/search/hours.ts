import { ServiceHours } from "@/types/service"

const DAYS: (keyof ServiceHours)[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

/**
 * Checks if the service is currently open based on local time.
 */
export function isOpenNow(hours?: ServiceHours): boolean {
  if (!hours) return false

  const now = new Date()
  const dayIndex = now.getDay()
  const dayName = DAYS[dayIndex]
  const prevDayName = DAYS[(dayIndex + 6) % 7]
  if (!dayName || !prevDayName) return false

  // Convert "HH:MM" to minutes from midnight
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const parseMinutes = (value: string): number | null => {
    const parts = value.split(":")
    if (parts.length !== 2) return null
    const h = Number(parts[0])
    const m = Number(parts[1])
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null
    return h * 60 + m
  }

  const isDayHoursOpenNow = (dayHours: unknown, treatOvernightAsFromPreviousDay: boolean): boolean => {
    if (!dayHours || typeof dayHours === "string") return false
    const record = dayHours as { open?: string; close?: string }
    if (!record.open || !record.close) return false

    const openMinutes = parseMinutes(record.open)
    const closeMinutes = parseMinutes(record.close)
    if (openMinutes === null || closeMinutes === null) return false

    // Overnight hours (e.g. 22:00 to 02:00) span across midnight.
    if (closeMinutes < openMinutes) {
      if (treatOvernightAsFromPreviousDay) {
        return currentMinutes < closeMinutes
      }
      return currentMinutes >= openMinutes
    }

    return currentMinutes >= openMinutes && currentMinutes < closeMinutes
  }

  const prevDayHours = hours[prevDayName]
  if (isDayHoursOpenNow(prevDayHours, true)) return true

  const todayHours = hours[dayName]
  return isDayHoursOpenNow(todayHours, false)
}

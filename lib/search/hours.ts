import { ServiceHours } from "@/types/service"

const DAYS: (keyof ServiceHours)[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

/**
 * Checks if the service is currently open based on local time.
 */
export function isOpenNow(hours?: ServiceHours): boolean {
  if (!hours) return false

  const now = new Date()
  const dayName = DAYS[now.getDay()]
  if (!dayName) return false

  const todayHours = hours[dayName]

  // Check if open/close exist and are strings (guard against 'notes')
  if (!todayHours || typeof todayHours === "string" || !todayHours.open || !todayHours.close) return false

  // Convert "HH:MM" to minutes from midnight
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const [openH, openM] = todayHours.open.split(":").map(Number)
  const [closeH, closeM] = todayHours.close.split(":").map(Number)

  if (openH === undefined || openM === undefined || closeH === undefined || closeM === undefined) return false

  const openMinutes = openH * 60 + openM
  const closeMinutes = closeH * 60 + closeM

  // Handle overnight hours (e.g. 16:00 to 08:00)
  if (closeMinutes < openMinutes) {
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes
  }

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes
}

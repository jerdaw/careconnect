import { ServiceHours } from "@/types/service"

const DAYS: (keyof ServiceHours)[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

interface DaySchedule {
  open: string
  close: string
}

function parseTimeToMinutes(timeString: string): number | null {
  const parts = timeString.split(":")
  if (parts.length !== 2) return null
  const hours = Number(parts[0])
  const minutes = Number(parts[1])
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

function isValidDaySchedule(dayHours: unknown): dayHours is DaySchedule {
  if (!dayHours || typeof dayHours === "string") return false
  const record = dayHours as Record<string, unknown>
  return typeof record.open === "string" && typeof record.close === "string"
}

function isOvernightSchedule(openMinutes: number, closeMinutes: number): boolean {
  return closeMinutes < openMinutes
}

function isWithinTodaySchedule(schedule: DaySchedule, currentMinutes: number): boolean {
  const openMinutes = parseTimeToMinutes(schedule.open)
  const closeMinutes = parseTimeToMinutes(schedule.close)
  if (openMinutes === null || closeMinutes === null) return false

  if (isOvernightSchedule(openMinutes, closeMinutes)) {
    return currentMinutes >= openMinutes
  }

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes
}

function isWithinOvernightCarryover(schedule: DaySchedule, currentMinutes: number): boolean {
  const openMinutes = parseTimeToMinutes(schedule.open)
  const closeMinutes = parseTimeToMinutes(schedule.close)
  if (openMinutes === null || closeMinutes === null) return false

  if (isOvernightSchedule(openMinutes, closeMinutes)) {
    return currentMinutes < closeMinutes
  }

  return false
}

export function isOpenNow(hours?: ServiceHours): boolean {
  if (!hours) return false

  const now = new Date()
  const dayIndex = now.getDay()
  const todayName = DAYS[dayIndex]
  const yesterdayName = DAYS[(dayIndex + 6) % 7]
  if (!todayName || !yesterdayName) return false

  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const yesterdayHours = hours[yesterdayName]
  if (isValidDaySchedule(yesterdayHours) && isWithinOvernightCarryover(yesterdayHours, currentMinutes)) {
    return true
  }

  const todayHours = hours[todayName]
  if (isValidDaySchedule(todayHours) && isWithinTodaySchedule(todayHours, currentMinutes)) {
    return true
  }

  return false
}

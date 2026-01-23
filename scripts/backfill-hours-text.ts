#!/usr/bin/env tsx
/**
 * Backfill `hours_text` from structured `hours`
 *
 * Governance:
 * - Only fills `hours_text` when it is missing and `hours` is present.
 * - Never overwrites an existing `hours_text`.
 * - Does not invent new hours; it formats what already exists in structured hours.
 *
 * Usage:
 *   node --import tsx scripts/backfill-hours-text.ts
 */

import fs from "fs/promises"
import path from "path"

type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"

interface ServiceHoursDay {
  open: string
  close: string
}

interface ServiceHours {
  monday?: ServiceHoursDay
  tuesday?: ServiceHoursDay
  wednesday?: ServiceHoursDay
  thursday?: ServiceHoursDay
  friday?: ServiceHoursDay
  saturday?: ServiceHoursDay
  sunday?: ServiceHoursDay
  notes?: string
}

interface Service {
  id: string
  name: string
  hours?: ServiceHours
  hours_text?: string
}

const DAY_ORDER: DayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

const DAY_LABEL: Record<DayKey, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
}

function isMissingText(value: string | undefined): boolean {
  return !value || value.trim().length === 0
}

function isOvernight(open: string, close: string): boolean {
  // Times are expected to be "HH:MM". If close sorts earlier than open, it crosses midnight.
  return close < open
}

function formatRange(open: string, close: string): string {
  const overnight = isOvernight(open, close)
  return overnight ? `${open}–${close} (overnight)` : `${open}–${close}`
}

function allSevenDaysSame(hours: ServiceHours): ServiceHoursDay | null {
  const first = hours.monday
  if (!first) return null
  for (const day of DAY_ORDER) {
    const h = hours[day]
    if (!h) return null
    if (h.open !== first.open || h.close !== first.close) return null
  }
  return first
}

function isTwentyFourSeven(day: ServiceHoursDay): boolean {
  return day.open === "00:00" && day.close === "23:59"
}

function groupConsecutiveDays(hours: ServiceHours): Array<{ start: DayKey; end: DayKey; open: string; close: string }> {
  const groups: Array<{ start: DayKey; end: DayKey; open: string; close: string }> = []

  let current: {
    start: DayKey
    end: DayKey
    open: string
    close: string
  } | null = null

  for (const day of DAY_ORDER) {
    const h = hours[day]
    if (!h) continue

    if (!current) {
      current = { start: day, end: day, open: h.open, close: h.close }
      continue
    }

    if (h.open === current.open && h.close === current.close) {
      current.end = day
      continue
    }

    groups.push(current)
    current = { start: day, end: day, open: h.open, close: h.close }
  }

  if (current) groups.push(current)
  return groups
}

function formatDayRange(start: DayKey, end: DayKey): string {
  if (start === end) return DAY_LABEL[start]
  return `${DAY_LABEL[start]}–${DAY_LABEL[end]}`
}

export function formatHoursText(hours: ServiceHours): string | null {
  const same = allSevenDaysSame(hours)
  if (same) {
    if (isTwentyFourSeven(same)) {
      return hours.notes ? `24/7. ${hours.notes}` : "24/7."
    }
    const base = `Daily: ${formatRange(same.open, same.close)}.`
    return hours.notes ? `${base} ${hours.notes}` : base
  }

  const groups = groupConsecutiveDays(hours)
  if (groups.length === 0) {
    return hours.notes ? hours.notes : null
  }

  const parts = groups.map((g) => `${formatDayRange(g.start, g.end)}: ${formatRange(g.open, g.close)}`)
  const base = `${parts.join("; ")}.`
  return hours.notes ? `${base} ${hours.notes}` : base
}

async function loadServices(): Promise<Service[]> {
  const servicesPath = path.join(process.cwd(), "data", "services.json")
  const data = await fs.readFile(servicesPath, "utf-8")
  return JSON.parse(data)
}

async function saveServices(services: Service[]): Promise<void> {
  const servicesPath = path.join(process.cwd(), "data", "services.json")
  await fs.writeFile(servicesPath, JSON.stringify(services, null, 2) + "\n", "utf-8")
}

async function main() {
  const services = await loadServices()

  let filled = 0
  let skippedNoHours = 0
  let skippedAlreadyHasText = 0
  let skippedUnformattable = 0

  for (const service of services) {
    if (!isMissingText(service.hours_text)) {
      skippedAlreadyHasText++
      continue
    }

    if (!service.hours) {
      skippedNoHours++
      continue
    }

    const text = formatHoursText(service.hours)
    if (!text) {
      skippedUnformattable++
      continue
    }

    service.hours_text = text
    filled++
  }

  await saveServices(services)

  console.log("✅ Backfill complete")
  console.log(`  Filled hours_text: ${filled}`)
  console.log(`  Skipped (no hours): ${skippedNoHours}`)
  console.log(`  Skipped (already had hours_text): ${skippedAlreadyHasText}`)
  console.log(`  Skipped (unformattable): ${skippedUnformattable}`)
}

main().catch((error) => {
  console.error("Error backfilling hours_text:", error)
  process.exit(1)
})

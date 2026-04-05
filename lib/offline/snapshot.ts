export const OFFLINE_SNAPSHOT_STALE_MS = 24 * 60 * 60 * 1000

export type OfflineSnapshotStatus = "fresh" | "stale" | "unknown"

export function getOfflineSnapshotStatus(lastSync?: string | null, now = Date.now()): OfflineSnapshotStatus {
  if (!lastSync) return "unknown"

  const parsed = Date.parse(lastSync)
  if (Number.isNaN(parsed)) return "unknown"

  return now - parsed > OFFLINE_SNAPSHOT_STALE_MS ? "stale" : "fresh"
}

export function formatOfflineSnapshotAge(lastSync: string, locale: string, now = Date.now()): string {
  const parsed = Date.parse(lastSync)
  if (Number.isNaN(parsed)) return ""

  const deltaSeconds = Math.round((parsed - now) / 1000)
  const absSeconds = Math.abs(deltaSeconds)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })

  if (absSeconds < 60) return rtf.format(deltaSeconds, "second")
  if (absSeconds < 60 * 60) return rtf.format(Math.round(deltaSeconds / 60), "minute")
  if (absSeconds < 24 * 60 * 60) return rtf.format(Math.round(deltaSeconds / (60 * 60)), "hour")
  if (absSeconds < 7 * 24 * 60 * 60) return rtf.format(Math.round(deltaSeconds / (24 * 60 * 60)), "day")

  return rtf.format(Math.round(deltaSeconds / (7 * 24 * 60 * 60)), "week")
}

export function formatOfflineSnapshotTimestamp(lastSync: string, locale: string): string {
  const parsed = Date.parse(lastSync)
  if (Number.isNaN(parsed)) return ""

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(parsed))
}

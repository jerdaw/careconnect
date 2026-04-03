import { LEGACY_BRAND_KEYS } from "@/lib/legacy-brand"

const CACHE_KEY = "careconnect-services-cache"
const LEGACY_CACHE_KEYS = LEGACY_BRAND_KEYS.servicesCache
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

interface CachedData<T> {
  data: T
  timestamp: number
}

export function getCachedServices<T>(): T | null {
  if (typeof window === "undefined") return null

  const legacyKey = LEGACY_CACHE_KEYS.find((key) => localStorage.getItem(key))
  const cached = localStorage.getItem(CACHE_KEY) ?? (legacyKey ? localStorage.getItem(legacyKey) : null)
  if (!cached) return null

  if (!localStorage.getItem(CACHE_KEY) && legacyKey) {
    localStorage.setItem(CACHE_KEY, cached)
    LEGACY_CACHE_KEYS.forEach((key) => localStorage.removeItem(key))
  }

  const { data, timestamp } = JSON.parse(cached) as CachedData<T>
  if (Date.now() - timestamp > CACHE_TTL) {
    localStorage.removeItem(CACHE_KEY)
    LEGACY_CACHE_KEYS.forEach((key) => localStorage.removeItem(key))
    return null
  }

  return data
}

export function setCachedServices<T>(data: T): void {
  if (typeof window === "undefined") return

  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      data,
      timestamp: Date.now(),
    })
  )
  LEGACY_CACHE_KEYS.forEach((key) => localStorage.removeItem(key))
}

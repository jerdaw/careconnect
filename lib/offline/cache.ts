const CACHE_KEY = "helpbridge-services-cache"
const LEGACY_CACHE_KEY = "kcc-services-cache"
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

interface CachedData<T> {
  data: T
  timestamp: number
}

export function getCachedServices<T>(): T | null {
  if (typeof window === "undefined") return null

  const cached = localStorage.getItem(CACHE_KEY) ?? localStorage.getItem(LEGACY_CACHE_KEY)
  if (!cached) return null

  if (!localStorage.getItem(CACHE_KEY) && localStorage.getItem(LEGACY_CACHE_KEY)) {
    localStorage.setItem(CACHE_KEY, cached)
    localStorage.removeItem(LEGACY_CACHE_KEY)
  }

  const { data, timestamp } = JSON.parse(cached) as CachedData<T>
  if (Date.now() - timestamp > CACHE_TTL) {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(LEGACY_CACHE_KEY)
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
  localStorage.removeItem(LEGACY_CACHE_KEY)
}

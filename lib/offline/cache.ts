const CACHE_KEY = "kcc-services-cache"
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

interface CachedData<T> {
  data: T
  timestamp: number
}

export function getCachedServices<T>(): T | null {
  if (typeof window === "undefined") return null

  const cached = localStorage.getItem(CACHE_KEY)
  if (!cached) return null

  const { data, timestamp } = JSON.parse(cached) as CachedData<T>
  if (Date.now() - timestamp > CACHE_TTL) {
    localStorage.removeItem(CACHE_KEY)
    return null
  }

  return data
}

export function setCachedServices<T>(data: T): void {
  if (typeof window === "undefined") return

  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data,
    timestamp: Date.now(),
  }))
}

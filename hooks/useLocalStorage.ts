"use client"

import { useState, useEffect, useCallback } from "react"
import { logger } from "@/lib/logger"

/**
 * A hook for using localStorage with SSR safety and automatic JSON serialization.
 * @param key The localStorage key
 * @param initialValue The initial value if no stored value exists
 * @param options Optional migration settings for legacy keys
 * @returns [storedValue, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: { legacyKeys?: string[] }
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const legacyKeys = options?.legacyKeys

  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydrate from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      let item = window.localStorage.getItem(key)

      if (!item && legacyKeys?.length) {
        for (const legacyKey of legacyKeys) {
          const legacyItem = window.localStorage.getItem(legacyKey)
          if (!legacyItem) continue

          item = legacyItem
          window.localStorage.setItem(key, legacyItem)
          window.localStorage.removeItem(legacyKey)
          break
        }
      }

      if (item) {
        setStoredValue(JSON.parse(item) as T)
      }
    } catch (error) {
      logger.error("Error reading localStorage key", error, { key })
    }
    setIsHydrated(true)
  }, [key, legacyKeys])

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value
        // Save state
        setStoredValue(valueToStore)
        // Save to local storage (client-side only)
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
          legacyKeys?.forEach((legacyKey) => window.localStorage.removeItem(legacyKey))
        }
      } catch (error) {
        logger.error("Error setting localStorage key", error, { key })
      }
    },
    [key, legacyKeys, storedValue]
  )

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key)
        legacyKeys?.forEach((legacyKey) => window.localStorage.removeItem(legacyKey))
      }
    } catch (error) {
      logger.error("Error removing localStorage key", error, { key })
    }
  }, [key, legacyKeys, initialValue])

  return [isHydrated ? storedValue : initialValue, setValue, removeValue]
}

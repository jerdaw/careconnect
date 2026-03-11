"use client"

import { useState, useEffect, useCallback } from "react"

const LEGACY_STORAGE_KEY = "kcc-high-contrast"
const STORAGE_KEY = "helpbridge-high-contrast"

export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false)

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
    if (stored === "true") {
      setIsHighContrast(true)
      document.documentElement.classList.add("high-contrast")
    }
    if (!localStorage.getItem(STORAGE_KEY) && localStorage.getItem(LEGACY_STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, stored ?? "false")
      localStorage.removeItem(LEGACY_STORAGE_KEY)
    }
  }, [])

  const toggleHighContrast = useCallback(() => {
    setIsHighContrast((prev) => {
      const next = !prev
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, String(next))
        localStorage.removeItem(LEGACY_STORAGE_KEY)
        if (next) {
          document.documentElement.classList.add("high-contrast")
        } else {
          document.documentElement.classList.remove("high-contrast")
        }
      }
      return next
    })
  }, [])

  return { isHighContrast, toggleHighContrast }
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { LEGACY_BRAND_KEYS } from "@/lib/legacy-brand"

const STORAGE_KEY = "careconnect-high-contrast"
const LEGACY_STORAGE_KEYS = LEGACY_BRAND_KEYS.highContrast

export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false)

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    const legacyKey = LEGACY_STORAGE_KEYS.find((key) => localStorage.getItem(key))
    const stored = localStorage.getItem(STORAGE_KEY) ?? (legacyKey ? localStorage.getItem(legacyKey) : null)
    if (stored === "true") {
      setIsHighContrast(true)
      document.documentElement.classList.add("high-contrast")
    }
    if (!localStorage.getItem(STORAGE_KEY) && legacyKey) {
      localStorage.setItem(STORAGE_KEY, stored ?? "false")
      LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
    }
  }, [])

  const toggleHighContrast = useCallback(() => {
    setIsHighContrast((prev) => {
      const next = !prev
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, String(next))
        LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
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

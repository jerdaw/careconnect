"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "kcc-high-contrast"

export function useHighContrast() {
    const [isHighContrast, setIsHighContrast] = useState(false)

    // Initialize from localStorage on mount
    useEffect(() => {
        if (typeof window === "undefined") return
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored === "true") {
            setIsHighContrast(true)
            document.documentElement.classList.add("high-contrast")
        }
    }, [])

    const toggleHighContrast = useCallback(() => {
        setIsHighContrast((prev) => {
            const next = !prev
            if (typeof window !== "undefined") {
                localStorage.setItem(STORAGE_KEY, String(next))
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

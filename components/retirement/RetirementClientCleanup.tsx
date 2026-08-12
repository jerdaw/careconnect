"use client"

import { useEffect } from "react"
import { clearRetiredClientData } from "@/lib/retirement/client-data-cleanup"

export function RetirementClientCleanup() {
  useEffect(() => {
    void clearRetiredClientData().finally(() => {
      document.documentElement.dataset.retirementCleanup = "complete"
    })
  }, [])

  return null
}

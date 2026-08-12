"use client"

import { useEffect } from "react"
import { clearRetiredClientData } from "@/lib/retirement/client-data-cleanup"

export function RetirementClientCleanup() {
  useEffect(() => {
    void clearRetiredClientData()
  }, [])

  return null
}

"use client"

import { useEffect } from "react"
import { trackEvent } from "@/lib/analytics"

interface ServiceDetailTrackerProps {
  serviceId: string
}

export function ServiceDetailTracker({ serviceId }: ServiceDetailTrackerProps) {
  useEffect(() => {
    trackEvent(serviceId, "view_detail")
  }, [serviceId])

  return null
}

"use client"

import { ReactNode } from "react"
import { trackEvent, type EventType } from "@/lib/analytics"

interface TrackedServiceLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  serviceId: string
  eventType: EventType
  children: ReactNode
}

export function TrackedServiceLink({
  href,
  serviceId,
  eventType,
  onClick,
  children,
  ...props
}: TrackedServiceLinkProps) {
  return (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        trackEvent(serviceId, eventType)
        onClick?.(event)
      }}
    >
      {children}
    </a>
  )
}

"use client"

import { useState } from "react"
import { MapPinned } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ExternalMapPanelProps {
  mapTitle: string
  embedUrl: string
  loadMapLabel: string
  privacyDescription: string
  externalNotice: string
  className?: string
  height?: number
}

export function ExternalMapPanel({
  mapTitle,
  embedUrl,
  loadMapLabel,
  privacyDescription,
  externalNotice,
  className,
  height = 180,
}: ExternalMapPanelProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  if (isLoaded) {
    return (
      <div className={cn("overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700", className)}>
        <iframe
          title={mapTitle}
          width="100%"
          height={String(height)}
          frameBorder="0"
          scrolling="no"
          loading="lazy"
          referrerPolicy="no-referrer"
          src={embedUrl}
          className="grayscale-[50%] transition-all hover:grayscale-0 dark:hue-rotate-180 dark:invert"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/60",
        className
      )}
    >
      <p className="text-sm text-neutral-700 dark:text-neutral-300">{privacyDescription}</p>
      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">{externalNotice}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4 w-full sm:w-auto"
        onClick={() => setIsLoaded(true)}
      >
        <MapPinned className="h-4 w-4" aria-hidden="true" />
        {loadMapLabel}
      </Button>
    </div>
  )
}

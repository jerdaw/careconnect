"use client"

import { MapPin, Navigation } from "lucide-react"
import { useTranslations } from "next-intl"
import type { PlaceId } from "@/types/service"
import { SUPPORTED_PLACES } from "@/lib/places/registry"
import { getSelectedPlaceLabel } from "@/lib/places/selection"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PlaceSelectorProps {
  selectedPlaceId: PlaceId
  isLocating: boolean
  onUseLocation: () => void
  onPlaceChange: (placeId: PlaceId) => void
}

export default function PlaceSelector({
  selectedPlaceId,
  isLocating,
  onUseLocation,
  onPlaceChange,
}: PlaceSelectorProps) {
  const t = useTranslations("PlaceSelector")
  const selectedLabel = getSelectedPlaceLabel(selectedPlaceId)
  const selectablePlaces = SUPPORTED_PLACES.filter((place) => place.status === "live" || place.status === "preview")

  return (
    <div className="flex max-w-full flex-wrap items-center justify-center gap-2" role="group" aria-label={t("label")}>
      <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-2.5 text-xs font-medium text-neutral-950 dark:border-neutral-300 dark:bg-white dark:text-neutral-950">
        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
        {t("selected", { place: selectedLabel })}
      </span>

      <Select value={selectedPlaceId} onValueChange={(value) => onPlaceChange(value as PlaceId)}>
        <SelectTrigger
          className="h-8 w-[150px] border-neutral-300 bg-white text-xs text-neutral-950 dark:border-neutral-300 dark:bg-white dark:text-neutral-950"
          aria-label={t("change")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {selectablePlaces.map((place) => (
            <SelectItem key={place.id} value={place.id}>
              {place.serviceLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-2.5 text-xs text-neutral-900 hover:text-neutral-950 dark:text-neutral-900 dark:hover:text-neutral-950"
        onClick={onUseLocation}
      >
        <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
        {isLocating ? t("locating") : t("useLocation")}
      </Button>
    </div>
  )
}

import { useState } from "react"
import { Loader2, MapPin, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { IntentCategory } from "@/types/service"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

const CATEGORIES = [
  IntentCategory.Crisis,
  IntentCategory.Food,
  IntentCategory.Housing,
  IntentCategory.Health,
  IntentCategory.Financial,
  IntentCategory.Legal,
  IntentCategory.Education,
  IntentCategory.Transport,
  IntentCategory.Employment,
  IntentCategory.Wellness,
  IntentCategory.Community,
  IntentCategory.Indigenous,
]

const FEATURED_CATEGORIES = new Set<IntentCategory>([
  IntentCategory.Crisis,
  IntentCategory.Food,
  IntentCategory.Housing,
  IntentCategory.Health,
  IntentCategory.Legal,
])

interface SearchControlsProps {
  userLocation: { lat: number; lng: number } | undefined
  toggleLocation: () => void
  isLocating: boolean
  category: string | undefined
  setCategory: (cat: string | undefined) => void
  openNow: boolean
  setOpenNow: (open: boolean) => void
}

export default function SearchControls({
  userLocation,
  toggleLocation,
  isLocating,
  category,
  setCategory,
  openNow,
  setOpenNow,
}: SearchControlsProps) {
  const t = useTranslations("Search")
  const [showAllCategories, setShowAllCategories] = useState(false)
  const inactiveSegmentClass =
    "border-transparent bg-transparent text-neutral-700 shadow-none hover:translate-y-0 hover:bg-neutral-100 hover:text-neutral-950 hover:shadow-none dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white"
  const activeSegmentClass =
    "border-transparent bg-neutral-900 text-white shadow-none hover:translate-y-0 hover:bg-neutral-800 hover:shadow-none dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex flex-col items-center gap-2.5">
        <div
          className="inline-flex max-w-full flex-wrap items-center justify-center gap-1 rounded-lg border border-neutral-200/70 bg-white/45 p-1 dark:border-white/10 dark:bg-slate-900/40"
          role="group"
          aria-label={t("utilityFilters")}
        >
          {/* Open Now Toggle */}
          <Button
            variant={openNow ? "default" : "ghost"}
            size="sm"
            onClick={() => setOpenNow(!openNow)}
            aria-pressed={openNow}
            className={cn("h-7 rounded-md px-2.5 text-xs", openNow ? activeSegmentClass : inactiveSegmentClass)}
          >
            <Clock className="h-3.5 w-3.5" />
            {openNow ? t("openNow") : t("openNow")}
          </Button>

          {/* Location Toggle */}
          <Button
            variant={userLocation ? "default" : "ghost"}
            size="sm"
            onClick={toggleLocation}
            aria-pressed={!!userLocation}
            aria-label={userLocation ? t("clearLocation") : t("filterByLocation")}
            className={cn("h-7 rounded-md px-2.5 text-xs", userLocation ? activeSegmentClass : inactiveSegmentClass)}
          >
            {isLocating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
            {userLocation ? t("nearMe") : t("useLocation")}
          </Button>
        </div>

        {/* Category Scroll */}
        <div
          id="homepage-category-filters"
          className="inline-flex max-w-full flex-wrap justify-center gap-1 rounded-lg border border-neutral-200/70 bg-white/45 p-1 dark:border-white/10 dark:bg-slate-900/40"
          role="group"
          aria-label={t("categoryFilters")}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCategory(undefined)}
            aria-pressed={!category}
            className={cn("h-7 rounded-md px-2.5 text-xs", !category ? activeSegmentClass : inactiveSegmentClass)}
          >
            {t("all")}
          </Button>
          {CATEGORIES.map((cat) => {
            const isFeatured = FEATURED_CATEGORIES.has(cat)
            const isSelectedHiddenCategory = category === cat && !isFeatured

            return (
              <Button
                key={cat}
                variant="ghost"
                size="sm"
                onClick={() => setCategory(cat === category ? undefined : cat)}
                aria-pressed={category === cat}
                className={cn(
                  "h-7 rounded-md px-2.5 text-xs whitespace-nowrap transition-all duration-300",
                  !isFeatured && !isSelectedHiddenCategory && !showAllCategories && "hidden",
                  category !== cat && inactiveSegmentClass,
                  cat === "Crisis" &&
                    !category &&
                    "text-red-800 hover:bg-red-50 hover:text-red-900 dark:text-red-200 dark:hover:bg-red-900/30",
                  cat === "Crisis" &&
                    category === "Crisis" &&
                    "border-transparent bg-red-600 text-white shadow-none hover:translate-y-0 hover:bg-red-700 hover:shadow-none dark:bg-red-600 dark:hover:bg-red-700",
                  category === cat && cat !== "Crisis" && activeSegmentClass
                )}
              >
                {t(cat.toLowerCase())}
              </Button>
            )
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllCategories((current) => !current)}
            aria-expanded={showAllCategories}
            aria-controls="homepage-category-filters"
            className={cn("h-7 rounded-md px-2.5 text-xs", inactiveSegmentClass)}
          >
            {showAllCategories ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {showAllCategories ? t("fewerCategories") : t("moreCategories")}
          </Button>
        </div>
      </div>
    </div>
  )
}

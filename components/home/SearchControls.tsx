import { Loader2, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { IntentCategory } from "@/types/service"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { ProfileSettings } from "@/components/settings"

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

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">

        {/* Open Now Toggle */}
        <Button
          variant={openNow ? "default" : "pill"}
          size="pill"
          onClick={() => setOpenNow(!openNow)}
          aria-pressed={openNow}
          className={openNow ? "rounded-full" : ""}
        >
          <Clock className="h-4 w-4" />
          {openNow ? t("openNow") : t("openNow")}
        </Button>

        {/* Location Toggle */}
        <Button
          variant={userLocation ? "default" : "pill"}
          size="pill"
          onClick={toggleLocation}
          aria-pressed={!!userLocation}
          aria-label={userLocation ? t("clearLocation") : t("filterByLocation")}
          className={userLocation ? "rounded-full" : ""}
        >
          {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          {userLocation ? t("nearMe") : t("useLocation")}
        </Button>

        {/* Personalization Toggle */}
        <ProfileSettings variant="pill" size="pill" />
      </div>

      {/* Category Scroll */}
      <div
        className="flex flex-wrap justify-center gap-2"
        role="group"
        aria-label={t("label")}
      >
        <Button
          variant={!category ? "default" : "secondary"}
          size="sm"
          onClick={() => setCategory(undefined)}
          aria-pressed={!category}
          className="rounded-full"
        >
          {t("all")}
        </Button>
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={category === cat ? "default" : "secondary"}
            size="sm"
            onClick={() => setCategory(cat === category ? undefined : cat)}
            aria-pressed={category === cat}
            className={cn(
              "rounded-full whitespace-nowrap transition-all duration-300",
              cat === "Crisis" &&
              !category &&
              "border-red-200 bg-red-50 text-red-700 shadow-sm hover:bg-red-100 hover:text-red-800 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/40",
              cat === "Crisis" &&
              category === "Crisis" &&
              "border-transparent bg-red-600 text-white shadow-md shadow-red-500/30 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            )}
          >
            {t(cat.toLowerCase())}
          </Button>
        ))}
      </div>
    </div>
  )
}


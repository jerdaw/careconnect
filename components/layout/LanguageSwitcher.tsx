"use client"

import { useLocale } from "next-intl"
import { usePathname, useRouter } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Languages, Check } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const LOCALES = [
  { code: "en", label: "English", flag: "🇨🇦" },
  { code: "fr", label: "Français (CA)", flag: "🇨🇦" },
  { code: "zh-Hans", label: "中文", flag: "🇨🇳" },
  { code: "ar", label: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pa", label: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
]

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const changeLanguage = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale as string })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative rounded-full transition-colors",
            "hover:bg-neutral-100 dark:hover:bg-neutral-800",
            "text-neutral-600 dark:text-neutral-300"
          )}
          aria-label="Select Language"
        >
          <Languages className="h-5 w-5" />
          <span className="sr-only">Select Language</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <div className="flex flex-col gap-1">
          {LOCALES.map((loc) => (
            <button
              key={loc.code}
              onClick={() => changeLanguage(loc.code)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                locale === loc.code
                  ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
              )}
              dir={loc.dir as "ltr" | "rtl" | "auto"}
            >
              <div className="flex items-center gap-2">
                <span>{loc.flag}</span>
                <span className="font-medium">{loc.label}</span>
              </div>
              {locale === loc.code && <Check className="h-4 w-4" />}
            </button>
          ))}

        </div>
      </PopoverContent>
    </Popover>
  )
}

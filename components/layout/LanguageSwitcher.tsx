"use client"

import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function LanguageSwitcher() {
  const t = useTranslations("Common")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const toggleLanguage = () => {
    const nextLocale = locale === "en" ? "fr" : "en"
    router.replace(pathname, { locale: nextLocale })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className={cn(
        "h-10 w-10 rounded-full font-semibold",
        "hover:bg-neutral-100 dark:hover:bg-neutral-800",
        "text-neutral-600 dark:text-neutral-300"
      )}
      aria-label={t("switchLanguage")}
    >
      {locale === "en" ? "FR" : "EN"}
    </Button>
  )
}

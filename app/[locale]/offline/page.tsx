"use client"

import { WifiOff, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { useEffect, useState } from "react"
import { getCachedServices } from "@/lib/offline/cache"
import ServiceCard from "@/components/ServiceCard"
import { SearchResult } from "@/lib/search/types"

export default function OfflinePage() {
  const t = useTranslations("Offline")
  const [cachedServices, setCached] = useState<SearchResult[]>([])

  useEffect(() => {
    const cached = getCachedServices<SearchResult[]>()
    if (cached) setCached(cached)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 dark:bg-neutral-950">
      <Header />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 flex-col items-center justify-center px-4 text-center focus:outline-none"
      >
        <div className="rounded-full bg-neutral-200 p-6 dark:bg-neutral-800">
          <WifiOff className="h-12 w-12 text-neutral-500 dark:text-neutral-400" />
        </div>
        <h1 className="heading-display mt-6 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-sm text-neutral-600 dark:text-neutral-400">{t("description")}</p>

        {cachedServices.length > 0 && (
          <section className="mt-8 w-full max-w-md text-left">
            <h2 className="mb-2 text-sm font-semibold text-neutral-500">{t("recentlyViewed")}</h2>
            <div className="space-y-4">
              {cachedServices.slice(0, 3).map((r) => (
                <ServiceCard key={r.service.id} service={r.service} />
              ))}
            </div>
          </section>
        )}

        <div className="mt-8 w-full max-w-md space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold text-neutral-900 dark:text-white">{t("emergencyContacts")}</h3>

            <ul className="mt-4 space-y-4">
              <li className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-medium text-neutral-900 dark:text-white">{t("crisisLine")}</p>
                  <p className="text-xs text-neutral-500">{t("crisisLineDesc")}</p>
                </div>
                <a
                  href="tel:6135444229"
                  className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300"
                >
                  <Phone className="h-4 w-4" />
                  {t("callButton")}
                </a>
              </li>
              <li className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-medium text-neutral-900 dark:text-white">{t("emergency")}</p>
                  <p className="text-xs text-neutral-500">{t("emergencyDesc")}</p>
                </div>
                <a
                  href="tel:911"
                  className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300"
                >
                  <Phone className="h-4 w-4" />
                  911
                </a>
              </li>
            </ul>
          </Card>

          <div className="flex justify-center">
            <Button variant="link" onClick={() => window.location.reload()}>
              {t("retryButton")}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

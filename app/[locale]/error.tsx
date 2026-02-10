"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { logger, generateErrorId } from "@/lib/logger"
import Link from "next/link"

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("Error")
  const errorId = generateErrorId()

  useEffect(() => {
    logger.error("Route error boundary caught error", error, {
      component: "error-page",
      errorId,
      digest: error.digest,
    })
  }, [error, errorId])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-red-100 p-4 dark:bg-red-900/30">
        <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
      </div>

      <h1 className="mb-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
        {t("title")}
      </h1>

      <p className="mb-6 max-w-md text-lg text-neutral-600 dark:text-neutral-400">{t("message")}</p>

      {error.digest && (
        <p className="mb-8 rounded-md bg-neutral-100 px-4 py-2 font-mono text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
          {t("errorId")}: {error.digest}
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button size="lg" onClick={reset} className="min-w-[180px]">
          {t("tryAgain")}
        </Button>
        <Link href="/">
          <Button variant="outline" size="lg" className="min-w-[180px]">
            {t("goHome")}
          </Button>
        </Link>
      </div>
    </div>
  )
}

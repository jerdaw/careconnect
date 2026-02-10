import { AlertCircle } from "lucide-react"
import { useTranslations } from "next-intl"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function NotFoundPage() {
  const t = useTranslations("NotFound")

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 font-sans dark:bg-neutral-950">
      <Header />

      <main id="main-content" className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-amber-100 p-4 dark:bg-amber-900/30">
          <AlertCircle className="h-10 w-10 text-amber-600 dark:text-amber-400" />
        </div>

        <h1 className="mb-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
          {t("title")}
        </h1>

        <p className="mb-8 max-w-md text-lg text-neutral-600 dark:text-neutral-400">{t("message")}</p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/">
            <Button size="lg" className="min-w-[180px]">
              {t("goHome")}
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="lg" className="min-w-[180px]">
              {t("searchServices")}
            </Button>
          </Link>
        </div>

        <p className="mt-12 max-w-sm text-sm text-neutral-500 dark:text-neutral-500">{t("helpText")}</p>
      </main>

      <Footer />
    </div>
  )
}

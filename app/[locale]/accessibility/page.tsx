"use client"

import { useTranslations } from "next-intl"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { Section } from "@/components/ui/section"
import { Accessibility } from "lucide-react"

export default function AccessibilityPage() {
  const t = useTranslations("AccessibilityPolicy")

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 font-sans dark:bg-neutral-950">
      <Header />

      <main className="flex-1">
        <Section className="py-20">
          <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm sm:p-12 dark:bg-neutral-900">
            <div className="mb-8 flex items-center gap-4">
              <div className="rounded-full bg-primary-100 p-3 dark:bg-primary-900">
                <Accessibility className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
                  {t("title")}
                </h1>
                <p className="mt-2 text-neutral-500 dark:text-neutral-400">
                  {t("lastUpdated", { date: new Date().toLocaleDateString() })}
                </p>
              </div>
            </div>

            <div className="prose prose-neutral max-w-none text-neutral-600 dark:prose-invert dark:text-neutral-300">
              <p className="lead text-lg">{t("commitment")}</p>
              <p>{t("standards")}</p>

              <h2>{t("headings.features")}</h2>
              <ul>
                <li>{t("features.contrast")}</li>
                <li>{t("features.keyboard")}</li>
                <li>{t("features.skip")}</li>
                <li>{t("features.alt")}</li>
                <li>{t("features.semantic")}</li>
                <li>{t("features.responsive")}</li>
              </ul>

              <h2>{t("headings.multiYearPlan")}</h2>
              <div className="not-prose grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                  <span className="mb-2 block font-bold text-primary-600">2026</span>
                  <p className="text-sm">{t("plan.y2026")}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                    <span className="mb-2 block font-bold text-primary-600">2027</span>
                  <p className="text-sm">{t("plan.y2027")}</p>
                </div>
                <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                    <span className="mb-2 block font-bold text-primary-600">2028</span>
                  <p className="text-sm">{t("plan.y2028")}</p>
                </div>
              </div>

              <h2>{t("headings.feedback")}</h2>
              <p>{t("feedback.intro")}</p>
              <p className="font-medium text-neutral-900 dark:text-white">
                {t("feedback.email")}
              </p>
              <p className="text-sm text-neutral-500 italic">
                {t("feedback.formats")}
              </p>
            </div>
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  )
}

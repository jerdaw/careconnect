"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { Section } from "@/components/ui/section"
import { Button } from "@/components/ui/button"

export default function PartnerCTA() {
  const t = useTranslations("Home.partnerCta")

  return (
    <Section className="py-16 md:py-20">
      <div className="border-t-primary-400 dark:border-t-primary-500 rounded-2xl border border-neutral-200 bg-neutral-50 p-8 dark:border-neutral-700 dark:bg-neutral-900/50">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{t("title")}</h2>
            <p className="mt-2 max-w-xl text-sm text-neutral-500 dark:text-neutral-400">{t("description")}</p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Button variant="default" asChild>
              <Link href="/submit-service">{t("suggestButton")}</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/about/partners">{t("learnMoreButton")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  )
}

"use client"

import { Check, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { Section } from "@/components/ui/section"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const LISTS = [
  {
    key: "does",
    Icon: Check,
    iconClass: "bg-emerald-600 text-white dark:bg-emerald-500",
    markerClass: "text-emerald-700 dark:text-emerald-300",
    itemCount: 4,
  },
  {
    key: "doesnt",
    Icon: X,
    iconClass: "bg-red-600 text-white dark:bg-red-500",
    markerClass: "text-red-700 dark:text-red-300",
    itemCount: 4,
  },
] as const

export default function CareConnectBoundaries() {
  const t = useTranslations("Home.boundaries")

  return (
    <Section className="bg-white/55 py-12 md:py-16 dark:bg-slate-950/30">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-primary-700 dark:text-primary-300 text-xs font-semibold tracking-[0.16em] uppercase">
          {t("eyebrow")}
        </p>
        <h2 className="heading-2 mt-2 text-neutral-950 dark:text-white">{t("title")}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          {t("description")}
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-2">
        {LISTS.map(({ key, Icon, iconClass, markerClass, itemCount }) => (
          <Card
            key={key}
            className="border-neutral-200/80 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
          >
            <div className="flex items-center gap-3">
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", iconClass)}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="text-base font-semibold text-neutral-950 dark:text-white">{t(`${key}.title`)}</h3>
            </div>

            <ul className="mt-6 space-y-3">
              {Array.from({ length: itemCount }, (_, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
                >
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", markerClass)} aria-hidden="true" />
                  <span>{t(`${key}.items.${index}`)}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        {t("note")}
      </p>
    </Section>
  )
}

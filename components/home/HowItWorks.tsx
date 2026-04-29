"use client"

import { Check, ExternalLink, Search, SlidersHorizontal } from "lucide-react"
import { useTranslations } from "next-intl"
import { Section } from "@/components/ui/section"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const STEPS = [
  {
    key: "privateSearch",
    stepNumber: "01",
    Icon: Search,
    iconBg: "bg-primary-600 dark:bg-primary-500",
    surfaceClass:
      "from-white/95 via-white/85 to-primary-50/40 dark:from-white/[0.07] dark:via-white/[0.05] dark:to-primary-950/25",
    badgeClass:
      "bg-primary-50/90 text-primary-700 ring-primary-200/70 dark:bg-primary-500/10 dark:text-primary-200 dark:ring-primary-400/20",
    markerClass: "text-primary-700 dark:text-primary-300",
  },
  {
    key: "filterResults",
    stepNumber: "02",
    Icon: SlidersHorizontal,
    iconBg: "bg-accent-600 dark:bg-accent-500",
    surfaceClass:
      "from-white/95 via-white/85 to-accent-50/35 dark:from-white/[0.07] dark:via-white/[0.05] dark:to-accent-950/20",
    badgeClass:
      "bg-accent-50/90 text-accent-700 ring-accent-200/70 dark:bg-accent-500/10 dark:text-accent-200 dark:ring-accent-400/20",
    markerClass: "text-accent-700 dark:text-accent-300",
  },
  {
    key: "connect",
    stepNumber: "03",
    Icon: ExternalLink,
    iconBg: "bg-indigo-600 dark:bg-indigo-500",
    surfaceClass:
      "from-white/95 via-white/85 to-indigo-50/35 dark:from-white/[0.07] dark:via-white/[0.05] dark:to-indigo-950/20",
    badgeClass:
      "bg-indigo-50/90 text-indigo-700 ring-indigo-200/70 dark:bg-indigo-500/10 dark:text-indigo-200 dark:ring-indigo-400/20",
    markerClass: "text-indigo-700 dark:text-indigo-300",
  },
] as const

type StepKey = (typeof STEPS)[number]["key"]

export default function HowItWorks() {
  const t = useTranslations("Home.howItWorks")

  return (
    <Section className="pt-6 pb-12 md:pt-7 md:pb-16">
      <div className="mx-auto mb-6 max-w-3xl text-center">
        <div className="inline-flex flex-col items-stretch">
          <h2 className="heading-2 text-neutral-900 dark:text-white">{t("title")}</h2>
          <span
            className="from-primary-500/50 via-accent-500/50 to-primary-500/50 mt-1.5 h-0.5 rounded-full bg-gradient-to-r"
            aria-hidden="true"
          />
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{t("subtitle")}</p>
      </div>

      <div>
        <ol className="m-0 grid list-none grid-cols-1 gap-8 p-0 md:grid-cols-3 md:gap-0">
          {STEPS.map(({ key, Icon, iconBg }) => (
            <li key={key} className="how-it-works-step relative flex flex-col items-center text-center md:px-8">
              <div
                className={cn(
                  "relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-full text-white",
                  iconBg
                )}
                aria-hidden="true"
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">{t(`steps.${key}.title`)}</h3>
            </li>
          ))}
        </ol>

        <div className="mt-6 grid grid-cols-1 gap-4 md:mt-10 md:grid-cols-3">
          {STEPS.map(({ key, stepNumber, surfaceClass, badgeClass, markerClass }) => (
            <StepDetailCard
              key={key}
              stepKey={key}
              stepNumber={stepNumber}
              surfaceClass={surfaceClass}
              badgeClass={badgeClass}
              markerClass={markerClass}
            />
          ))}
        </div>
      </div>
    </Section>
  )
}

function StepDetailCard({
  stepKey,
  stepNumber,
  surfaceClass,
  badgeClass,
  markerClass,
}: {
  stepKey: StepKey
  stepNumber: string
  surfaceClass: string
  badgeClass: string
  markerClass: string
}) {
  const t = useTranslations("Home.howItWorks")

  return (
    <Card
      padding="none"
      className={cn(
        "h-full border-white/80 bg-gradient-to-br shadow-[0_14px_34px_rgba(15,23,42,0.07)] ring-1 ring-white/70 backdrop-blur-md dark:border-white/10 dark:ring-white/10",
        surfaceClass
      )}
    >
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-semibold text-neutral-950 dark:text-white">{t(`steps.${stepKey}.cardTitle`)}</p>
          <span
            className={cn(
              "inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[0.68rem] leading-none font-semibold tracking-wide ring-1",
              badgeClass
            )}
            aria-hidden="true"
          >
            {stepNumber}
          </span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {t(`steps.${stepKey}.description`)}
        </p>

        <ul className="mt-4 space-y-2 border-t border-neutral-200/70 pt-3 dark:border-white/10">
          {[0, 1].map((index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
            >
              <Check className={cn("mt-0.5 h-4 w-4 shrink-0", markerClass)} aria-hidden="true" />
              <span>{t(`steps.${stepKey}.details.${index}`)}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}

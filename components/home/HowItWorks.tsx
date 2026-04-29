"use client"

import { Search, SlidersHorizontal, ExternalLink } from "lucide-react"
import { useTranslations } from "next-intl"
import { Section } from "@/components/ui/section"
import { cn } from "@/lib/utils"

const STEP_STYLES = [
  { bg: "bg-primary-600 dark:bg-primary-500", Icon: Search },
  { bg: "bg-accent-600 dark:bg-accent-500", Icon: SlidersHorizontal },
  { bg: "bg-indigo-600 dark:bg-indigo-500", Icon: ExternalLink },
] as const

export default function HowItWorks() {
  const t = useTranslations("About.howItWorks")

  const steps = [
    { number: 1, title: t("step1.title"), description: t("step1.description") },
    { number: 2, title: t("step2.title"), description: t("step2.description") },
    { number: 3, title: t("step3.title"), description: t("step3.description") },
  ]

  return (
    <Section className="py-12 md:py-16">
      <div className="mb-10 text-center">
        <h2 className="heading-2 text-neutral-900 dark:text-white">{t("title")}</h2>
        <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{t("subtitle")}</p>
      </div>
      <ol className="m-0 grid list-none grid-cols-1 gap-8 p-0 md:grid-cols-3 md:gap-0">
        {steps.map(({ number, title, description }, index) => {
          const { bg, Icon } = STEP_STYLES[index]!
          return (
            <li key={number} className="how-it-works-step relative flex flex-col items-center text-center md:px-8">
              <div
                className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-full text-white", bg)}
                aria-hidden="true"
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-semibold text-neutral-900 dark:text-white">{title}</h3>
              <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{description}</p>
            </li>
          )
        })}
      </ol>
    </Section>
  )
}

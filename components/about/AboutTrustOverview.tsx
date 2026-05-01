"use client"

import { BookOpenCheck, Check, FileCheck2, Languages, ShieldCheck, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { Section } from "@/components/ui/section"
import { Link } from "@/i18n/routing"
import { cn } from "@/lib/utils"

const TRUST_ITEMS = [
  {
    key: "sources",
    Icon: BookOpenCheck,
    iconClass: "bg-accent-50 text-accent-700 ring-accent-200/70 dark:bg-accent-500/10 dark:text-accent-200",
  },
  {
    key: "review",
    Icon: FileCheck2,
    iconClass: "bg-accent-50 text-accent-700 ring-accent-200/70 dark:bg-accent-500/10 dark:text-accent-200",
  },
  {
    key: "privacy",
    Icon: ShieldCheck,
    iconClass: "bg-emerald-50 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-200",
  },
  {
    key: "languages",
    Icon: Languages,
    iconClass: "bg-accent-50 text-accent-700 ring-accent-200/70 dark:bg-accent-500/10 dark:text-accent-200",
  },
] as const

const BOUNDARY_LISTS = [
  {
    key: "does",
    Icon: Check,
    iconClass: "bg-emerald-50 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-200",
    markerClass: "text-emerald-700 dark:text-emerald-300",
  },
  {
    key: "doesnt",
    Icon: X,
    iconClass: "bg-amber-50 text-amber-700 ring-amber-200/70 dark:bg-amber-500/10 dark:text-amber-200",
    markerClass: "text-amber-700 dark:text-amber-300",
  },
] as const

export default function AboutTrustOverview() {
  const t = useTranslations("About")

  return (
    <Section animate={false} className="relative pt-6 pb-14 md:pt-8 md:pb-16">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-accent-700 dark:text-accent-300 text-xs font-semibold tracking-[0.16em] uppercase">
              {t("sourceGovernance.eyebrow")}
            </p>
            <h2 className="heading-2 mt-2 max-w-xl text-neutral-950 dark:text-white">{t("sourceGovernance.title")}</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
              {t("sourceGovernance.description")}
            </p>
            <Link
              href="/about/partners"
              className="text-accent-700 hover:text-accent-600 dark:text-accent-300 dark:hover:text-accent-200 mt-5 inline-flex text-sm font-semibold"
            >
              {t("cta.partners")}
            </Link>
          </div>

          <div className="rounded-2xl border border-neutral-200/80 bg-white/82 p-5 shadow-sm shadow-neutral-900/5 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.05] dark:shadow-none">
            <div className="grid gap-4 sm:grid-cols-2">
              {TRUST_ITEMS.map(({ key, Icon, iconClass }) => (
                <div key={key} className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
                      iconClass
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-950 dark:text-white">
                      {t(`sourceGovernance.items.${key}.title`)}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                      {t(`sourceGovernance.items.${key}.description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative mt-10 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/78 p-5 shadow-sm shadow-neutral-900/5 backdrop-blur-md md:p-6 dark:border-white/10 dark:bg-white/[0.05] dark:shadow-none">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-accent-700 dark:text-accent-300 text-xs font-semibold tracking-[0.16em] uppercase">
              {t("boundaries.eyebrow")}
            </p>
            <h2 className="mt-2 text-2xl leading-tight font-bold text-neutral-950 md:text-3xl dark:text-white">
              {t("boundaries.title")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
              {t("boundaries.description")}
            </p>
          </div>

          <div className="mt-6 grid gap-6 border-t border-neutral-200/70 pt-6 md:grid-cols-2 dark:border-white/10">
            {BOUNDARY_LISTS.map(({ key, Icon, iconClass, markerClass }) => (
              <div key={key}>
                <div className="flex items-center gap-3">
                  <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl ring-1", iconClass)}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-base font-semibold text-neutral-950 dark:text-white">
                    {t(`boundaries.${key}.title`)}
                  </h3>
                </div>
                <ul className="mt-4 space-y-3">
                  {[0, 1, 2, 3].map((index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
                    >
                      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", markerClass)} aria-hidden="true" />
                      <span>{t(`boundaries.${key}.items.${index}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            {t("boundaries.note")}
          </p>
        </div>
      </div>
    </Section>
  )
}

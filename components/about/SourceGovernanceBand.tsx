"use client"

import { BookOpenCheck, FileCheck2, Languages, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { Section } from "@/components/ui/section"

const ITEMS = [
  {
    key: "sources",
    Icon: BookOpenCheck,
    href: "/about/partners",
  },
  {
    key: "review",
    Icon: FileCheck2,
    href: "/about",
  },
  {
    key: "privacy",
    Icon: ShieldCheck,
    href: "/privacy",
  },
  {
    key: "languages",
    Icon: Languages,
    href: "/accessibility",
  },
] as const

export default function SourceGovernanceBand() {
  const t = useTranslations("About.sourceGovernance")

  return (
    <Section className="border-y border-neutral-200/70 bg-neutral-50/80 py-14 md:py-16 dark:border-white/10 dark:bg-slate-950/60">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.6fr] lg:items-start">
        <div>
          <p className="text-primary-700 dark:text-primary-300 text-xs font-semibold tracking-[0.16em] uppercase">
            {t("eyebrow")}
          </p>
          <h2 className="heading-2 mt-2 text-neutral-950 dark:text-white">{t("title")}</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
            {t("description")}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {ITEMS.map(({ key, Icon, href }) => (
            <Link
              key={key}
              href={href}
              className="group hover:border-primary-200 focus-visible:outline-primary-500 dark:hover:border-primary-400/40 rounded-xl border border-neutral-200/80 bg-white/80 p-4 shadow-sm shadow-neutral-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none dark:hover:bg-white/[0.07]"
            >
              <span className="flex items-start gap-3">
                <span className="bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-black/5 dark:ring-white/10">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-neutral-950 dark:text-white">
                    {t(`items.${key}.title`)}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    {t(`items.${key}.description`)}
                  </span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </Section>
  )
}
